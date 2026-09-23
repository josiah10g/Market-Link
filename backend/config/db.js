const { supabase } = require('./supabase');


module.exports = {
  supabase,

  query: async (sqlText, params = []) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    const cleanSql = sqlText.trim();
    const lower = cleanSql.toLowerCase();

  
    if (lower.includes('count(*)') && lower.includes('from orders') && lower.includes('vendor_id')) {
      const vendorId = params[0];
      const { data: vendorOrders, error } = await supabase
        .from('orders')
        .select('id, total_amount, status')
        .eq('vendor_id', vendorId);

      if (error) throw error;
      const total_orders = vendorOrders?.length || 0;
      const total_revenue = vendorOrders
        ?.filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
      const pending_orders = vendorOrders?.filter(o => o.status === 'pending').length || 0;
      const active_orders = vendorOrders?.filter(o => ['accepted', 'in_progress', 'ready'].includes(o.status)).length || 0;

      return {
        rows: [{
          total_orders,
          total_revenue,
          pending_orders,
          active_orders
        }]
      };
    }

    if (lower.includes('select count(*) from') || lower.includes('select (select count(*)')) {

      const [{ count: vendorCount }, { count: userCount }, { count: orderCount }] = await Promise.all([
        supabase.from('vendors').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true })
      ]);
      return {
        rows: [{
          total_vendors: vendorCount || 0,
          total_users: userCount || 0,
          total_orders: orderCount || 0,
          pending_approvals: 0,
          total_platform_volume: 0
        }]
      };
    }

    
    if (lower.startsWith('select id from users where email =') || lower.startsWith('select * from users where email =')) {
      const email = params[0]?.toLowerCase()?.trim();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email);
      if (error) throw error;
      return { rows: data || [] };
    }


    if (lower.startsWith('select id, name, email, phone, role') && lower.includes('from users where id =')) {
      const id = params[0];
      const { data, error } = await supabase.from('users').select('*').eq('id', id);
      if (error) throw error;
      return { rows: data || [] };
    }

    if ((lower.includes('from users where id =') || lower.includes('from users where id=$')) && !lower.startsWith('update')) {
      const id = params[0];
      const { data, error } = await supabase.from('users').select('*').eq('id', id);
      if (error) throw error;
      return { rows: data || [] };
    }

    
    if (lower.startsWith('select email') && lower.includes('from users where id =')) {
      const id = params[0];
      const { data, error } = await supabase.from('users').select('email, name').eq('id', id);
      if (error) throw error;
      return { rows: data || [] };
    }

    if (lower.includes('from vendors where user_id =')) {
      const userId = params[0];
      const { data, error } = await supabase.from('vendors').select('*').eq('user_id', userId);
      if (error) throw error;
      return { rows: data || [] };
    }


    if (lower.includes('from vendors where id =') || lower.includes('from vendors where id=$') || lower.includes('from vendors v where v.id =') || lower.includes('from vendors v join users') || lower.includes('from vendors v')) {
      if (lower.includes('where v.id =') || lower.includes('where id =')) {
        const id = params[0];
        const { data, error } = await supabase.from('vendors').select('*, users(name, email)').eq('id', id);
        if (error) throw error;
        const formatted = (data || []).map(v => ({
          ...v,
          owner_name: v.users?.name,
          user_name: v.users?.name,
          email: v.users?.email,
          user_email: v.users?.email
        }));
        return { rows: formatted };
      }
    }

  
    if (lower.startsWith('select * from products where vendor_id =') || (lower.includes('from products where vendor_id =') && !lower.includes('stock_quantity <='))) {
      const vendorId = params[0];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { rows: data || [] };
    }


    if (lower.includes('stock_quantity <= 5') || (lower.includes('from products') && lower.includes('stock_quantity <='))) {
      const vendorId = params[0];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('stock_quantity', { ascending: true })
        .limit(10);
      if (error) throw error;
      return { rows: data || [] };
    }

    if (lower.startsWith('insert into users')) {
      const [name, email, passwordHash, phone, city, address, role] = params;
      const { data, error } = await supabase
        .from('users')
        .insert({
          name,
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          phone: phone || null,
          city: city || 'Abuja',
          address: address || null,
          role: role || 'customer',
          is_active: true
        })
        .select()
        .single();
      if (error) throw error;
      return { rows: [data] };
    }


    if (lower.startsWith('insert into vendors')) {
      const [userId, businessName, desc, category, phone, address, status] = params;
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          user_id: userId,
          business_name: businessName,
          description: desc,
          category,
          phone,
          address,
          city: 'Abuja',
          status: status || 'pending'
        })
        .select()
        .single();
      if (error) throw error;
      return { rows: [data] };
    }


    if (lower.startsWith('insert into products')) {
      const [vendorId, name, description, price, category, stockQuantity, leadTime, imageUrl] = params;
      const { data, error } = await supabase
        .from('products')
        .insert({
          vendor_id: vendorId,
          name,
          description: description || '',
          price,
          category,
          stock_quantity: stockQuantity || 0,
          lead_time: leadTime || 'Same-Day',
          image_url: imageUrl || null,
          is_active: true
        })
        .select()
        .single();
      if (error) throw error;
      return { rows: [data] };
    }


    if (lower.startsWith('update products')) {
      if (lower.includes('stock_quantity = stock_quantity +') || lower.includes('stock_quantity = stock_quantity -') || (lower.includes('set stock_quantity =') && params.length <= 2)) {
        const quantity = parseInt(params[0], 10);
        const id = params[params.length - 1];

        const { data: current, error: fetchErr } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', id)
          .single();
        if (fetchErr) throw fetchErr;

        let newStock;
        if (lower.includes('stock_quantity = stock_quantity +')) {
          newStock = (current.stock_quantity || 0) + quantity;
        } else if (lower.includes('stock_quantity = stock_quantity -')) {
          newStock = Math.max(0, (current.stock_quantity || 0) - quantity);
        } else {
          newStock = quantity;
        }

        const { data, error } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { rows: [data] };
      }


      const [name, description, price, category, stock_quantity, lead_time, image_url, is_active, id, vendorId] = params;
      const updateData = {};
      if (name !== undefined && name !== null) updateData.name = name;
      if (description !== undefined && description !== null) updateData.description = description;
      if (price !== undefined && price !== null) updateData.price = price;
      if (category !== undefined && category !== null) updateData.category = category;
      if (stock_quantity !== undefined && stock_quantity !== null) updateData.stock_quantity = stock_quantity;
      if (lead_time !== undefined && lead_time !== null) updateData.lead_time = lead_time;
      if (image_url !== undefined && image_url !== null) updateData.image_url = image_url;
      if (is_active !== undefined && is_active !== null) updateData.is_active = is_active;

      let query = supabase.from('products').update(updateData).eq('id', id);
      if (vendorId) query = query.eq('vendor_id', vendorId);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return { rows: [data] };
    }


    if (lower.startsWith('update vendors')) {
      if (lower.includes('set status =') && params.length === 2) {
        const [status, id] = params;
        const { data, error } = await supabase
          .from('vendors')
          .update({ status })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { rows: [data] };
      }

  
      const [business_name, description, category, phone, address, city, logo_url, banner_url, user_id] = params;
      const updateData = {};
      if (business_name) updateData.business_name = business_name;
      if (description) updateData.description = description;
      if (category) updateData.category = category;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
      if (city) updateData.city = city;
      if (logo_url) updateData.logo_url = logo_url;
      if (banner_url) updateData.banner_url = banner_url;

      const { data, error } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('user_id', user_id)
        .select()
        .single();
      if (error) throw error;
      return { rows: [data] };
    }

    if (lower.startsWith('insert into orders')) {
 
      const [order_code, customer_id, vendor_id, total_amount, payment_status, payment_method, delivery_address, notes, payment_reference] = params;
      const insertObj = {
        order_code,
        customer_id,
        vendor_id,
        total_amount,
        status: 'pending',
        payment_status: payment_status || 'pay_on_delivery',
        payment_method: payment_method || 'pay_on_delivery',
        delivery_address,
        notes: notes || null
      };
      if (payment_reference) {
        insertObj.payment_reference = payment_reference;
      }
      const { data, error } = await supabase
        .from('orders')
        .insert(insertObj)
        .select()
        .single();
      if (error) throw error;
      return { rows: [data] };
    }

 
    if (lower.startsWith('insert into order_items')) {
      const [order_id, product_id, product_name, price, quantity] = params;
      const { data, error } = await supabase
        .from('order_items')
        .insert({
          order_id,
          product_id,
          product_name,
          price,
          quantity
        })
        .select()
        .single();
      if (error) throw error;
      return { rows: [data] };
    }

    if (lower.startsWith('insert into notifications')) {
      const [user_id, order_id, type, title, message] = params;
      const insertObj = {
        user_id,
        type,
        title,
        message,
        is_read: false
      };
      if (order_id) insertObj.order_id = order_id;
      const { data, error } = await supabase
        .from('notifications')
        .insert(insertObj)
        .select()
        .single();
      if (error) {
        console.warn('[DB Bridge] Notifications insert error (table may not exist):', error.message);
        return { rows: [{ id: null }] };
      }
      return { rows: [data] };
    }

    
    if (lower.startsWith('update orders')) {
  
      if (lower.includes('payment_status') && lower.includes('payment_reference')) {

        const payment_status = params[0];
        const payment_reference = params[1];
        const payment_method = params[2];
        const orderId = params[params.length - 1];

        const { data, error } = await supabase
          .from('orders')
          .update({
            payment_status,
            payment_reference,
            payment_method: payment_method || 'paystack'
          })
          .eq('id', orderId)
          .select()
          .single();
        if (error) throw error;
        return { rows: [data] };
      }

  
      const status = params[0];
      const orderId = params[params.length - 1];
      const { data, error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();
      if (error) throw error;
      return { rows: [data] };
    }

    if (lower.startsWith('insert into reviews')) {
      const [order_id, customer_id, vendor_id, rating, comment] = params;
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          order_id,
          customer_id,
          vendor_id,
          rating,
          comment: comment || null
        })
        .select()
        .single();
      if (error) throw error;
      return { rows: [data] };
    }

    
    if (lower.includes('from vendors v') || lower.includes('from vendors')) {
      let q = supabase.from('vendors').select('*, users(name, email)');
      if (lower.includes("v.status = 'approved'") || lower.includes("status = 'approved'")) {
        q = q.eq('status', 'approved');
      } else if (lower.includes('where v.status = $1') && params.length > 0) {
        q = q.eq('status', params[0]);
      }
      
  
      if (params.length > 0) {
        if (lower.includes('lower(v.category) = lower(') || lower.includes('category =')) {
          const catParam = params.find(p => typeof p === 'string' && !p.startsWith('%') && !p.endsWith('%') && !['approved', 'pending', 'suspended', 'rejected'].includes(p));
          if (catParam) {
            q = q.ilike('category', catParam);
          }
        }
      }

      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      let formatted = (data || []).map(v => ({
        ...v,
        owner_name: v.users?.name,
        user_name: v.users?.name,
        email: v.users?.email,
        user_email: v.users?.email
      }));

      if (lower.includes('business_name ilike') || lower.includes('description ilike')) {
        const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
        if (searchParam) {
          const term = searchParam.replace(/%/g, '').toLowerCase();
          formatted = formatted.filter(v =>
            (v.business_name && v.business_name.toLowerCase().includes(term)) ||
            (v.description && v.description.toLowerCase().includes(term))
          );
        }
      }

      return { rows: formatted };
    }

    if (lower.includes('from products')) {
      let q = supabase.from('products').select('*, vendors(business_name, category, city, status)');
      if (lower.includes('is_active = true')) {
        q = q.eq('is_active', true);
      }
      if (lower.includes('p.vendor_id =') || lower.includes('vendor_id =')) {
      
        const vendorIdParam = params.find(p => typeof p === 'number' || (!isNaN(parseInt(p, 10)) && typeof p === 'string' && !p.includes('%')));
        if (vendorIdParam) {
          q = q.eq('vendor_id', parseInt(vendorIdParam, 10));
        }
      }
      if (lower.includes('lower(p.category) = lower(') || lower.includes('category =')) {
        const catParam = params.find(p => typeof p === 'string' && !p.includes('%') && isNaN(parseInt(p, 10)));
        if (catParam) {
          q = q.ilike('category', catParam);
        }
      }
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      let formatted = (data || []).map(p => ({
        ...p,
        business_name: p.vendors?.business_name,
        vendor_city: p.vendors?.city,
        vendor_category: p.vendors?.category,
        vendor_status: p.vendors?.status
      }));

      if (lower.includes('p.name ilike') || lower.includes('p.description ilike')) {
        const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
        if (searchParam) {
          const term = searchParam.replace(/%/g, '').toLowerCase();
          formatted = formatted.filter(p =>
            (p.name && p.name.toLowerCase().includes(term)) ||
            (p.description && p.description.toLowerCase().includes(term)) ||
            (p.business_name && p.business_name.toLowerCase().includes(term))
          );
        }
      }

      return { rows: formatted };
    }

    if (lower.includes('from orders')) {
      
      if (lower.includes('from orders where id =') || lower.includes('from orders where id=$') || lower.includes('from orders o where o.id =')) {
        const orderId = params[0];
        let q = supabase.from('orders').select('*').eq('id', orderId);
        if (params.length > 1 && (lower.includes('vendor_id =') || lower.includes('vendor_id=$'))) {
          q = q.eq('vendor_id', params[1]);
        }
        const { data, error } = await q;
        if (error) throw error;
        return { rows: data || [] };
      }

      
      if (lower.includes('from order_items where order_id =')) {
        const orderId = params[0];
        const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
        if (error) throw error;
        return { rows: data || [] };
      }

      let q = supabase
        .from('orders')
        .select('*, users(name, phone, email), vendors(business_name, category, phone), order_items(*)')
        .order('created_at', { ascending: false });

      if (lower.includes('where o.vendor_id =') || lower.includes('where vendor_id =')) {
        q = q.eq('vendor_id', params[0]);
      } else if (lower.includes('where o.customer_id =') || lower.includes('where customer_id =')) {
        q = q.eq('customer_id', params[0]);
      }

      const { data, error } = await q;
      if (error) throw error;
      const formatted = (data || []).map(o => ({
        ...o,
        customer_name: o.users?.name,
        customer_phone: o.users?.phone,
        customer_email: o.users?.email,
        vendor_name: o.vendors?.business_name,
        vendor_category: o.vendors?.category,
        vendor_phone: o.vendors?.phone,
        items: o.order_items || []
      }));
      return { rows: formatted };
    }

    
    if (lower.startsWith('update users set')) {
    
      const userId = params[params.length - 1];
      
      const setClauseMatch = cleanSql.match(/SET\s+(.*?)\s+WHERE/i);
      if (setClauseMatch) {
        const setClause = setClauseMatch[1];
        const fieldAssignments = setClause.split(',').map(s => s.trim());
        const updateObj = {};
        fieldAssignments.forEach((assignment, idx) => {
          const fieldName = assignment.split('=')[0].trim();
          updateObj[fieldName] = params[idx];
        });

        let { data, error } = await supabase
          .from('users')
          .update(updateObj)
          .eq('id', userId)
          .select()
          .single();

        if (error && (error.message?.includes('avatar_url') || error.code === 'PGRST204')) {
          delete updateObj.avatar_url;
          const retry = await supabase
            .from('users')
            .update(updateObj)
            .eq('id', userId)
            .select()
            .single();
          data = retry.data;
          error = retry.error;
        }

        if (error) throw error;
        return { rows: [data] };
      }
    }

 
    if (lower.includes('from notifications')) {
      const userId = params[0];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) {
       
        console.warn('[DB Bridge] Notifications query error (table may not exist):', error.message);
        return { rows: [] };
      }
      return { rows: data || [] };
    }

 
    if (lower.startsWith('update notifications')) {
      if (lower.includes('where id =')) {
        const id = params[params.length - 1];
        const { data, error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id)
          .select()
          .single();
        if (error) {
          console.warn('[DB Bridge] Notification update error:', error.message);
          return { rows: [] };
        }
        return { rows: [data] };
      }
      // Mark all read for user
      if (lower.includes('where user_id =')) {
        const userId = params[0];
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('is_read', false);
        if (error) {
          console.warn('[DB Bridge] Notifications bulk update error:', error.message);
        }
        return { rows: [] };
      }
      return { rows: [] };
    }

    if (lower.startsWith('delete from products')) {
      const id = params[0];
      let query = supabase.from('products').delete().eq('id', id);
      if (params.length > 1) {
        query = query.eq('vendor_id', params[1]);
      }
      const { error } = await query;
      if (error) throw error;
      return { rows: [] };
    }

    if (lower.includes('from order_items')) {
      const orderId = params[0];
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      if (error) {
        console.warn('[DB Bridge] order_items query error:', error.message);
        return { rows: [] };
      }
      return { rows: data || [] };
    }

    if (lower.includes('from reviews')) {
      if (lower.includes('where r.order_id =') || lower.includes('where order_id =')) {
        const orderId = params[0];
        const customerId = params.length > 1 ? params[1] : null;
        let q = supabase.from('reviews').select('*').eq('order_id', orderId);
        if (customerId) q = q.eq('customer_id', customerId);
        const { data, error } = await q;
        if (error) throw error;
        return { rows: data || [] };
      }
      
      let q = supabase.from('reviews').select('*, users(name), vendors(business_name), orders(order_code)');
      if (params.length > 0 && lower.includes('vendor_id')) {
        q = q.eq('vendor_id', params[0]);
      }
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      const formatted = (data || []).map(r => ({
        ...r,
        customer_name: r.users?.name || 'Customer',
        vendor_name: r.vendors?.business_name || 'Vendor',
        order_code: r.orders?.order_code
      }));
      return { rows: formatted };
    }

    
    if (lower.startsWith('delete from reviews')) {
      const id = params[0];
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      return { rows: [] };
    }


    if (lower.includes('total_orders = total_orders + 1')) {
      const vendorId = params[0];
      const { data: current } = await supabase.from('vendors').select('total_orders').eq('id', vendorId).single();
      const { error } = await supabase
        .from('vendors')
        .update({ total_orders: (current?.total_orders || 0) + 1 })
        .eq('id', vendorId);
      if (error) console.warn('[DB Bridge] Vendor total_orders update error:', error.message);
      return { rows: [] };
    }

    if (lower.startsWith('update vendors set rating')) {
      const rating = params[0];
      const ratingCount = params[1];
      const vendorId = params[params.length - 1];
      const { error } = await supabase
        .from('vendors')
        .update({ rating, rating_count: ratingCount })
        .eq('id', vendorId);
      if (error) console.warn('[DB Bridge] Vendor rating update error:', error.message);
      return { rows: [] };
    }


    if (lower === 'begin' || lower === 'commit' || lower === 'rollback') {
      return { rows: [] };
    }

    if (lower.startsWith('alter table')) {
      return { rows: [] };
    }

  
    console.warn('[DB Bridge] Unhandled query pattern:', cleanSql.slice(0, 80));
    return { rows: [{ total_orders: 0, total_revenue: 0, pending_orders: 0, active_orders: 0 }] };
  },

  getClient: async () => {
    return {
      query: async (text, params) => module.exports.query(text, params),
      release: () => {}
    };
  }
};
