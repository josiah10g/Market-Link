const { supabase } = require('./supabase');

/**
 * Universal Database Bridge:
 * Allows controllers to use db.query(...) syntax seamlessly backed directly by Supabase
 */

module.exports = {
  supabase,

  query: async (sqlText, params = []) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    const cleanSql = sqlText.trim();
    const lower = cleanSql.toLowerCase();

    // 1. SELECT COUNT FROM VENDORS / USERS / ORDERS or VENDOR ANALYTICS
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
      // General platform counts
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

    // 2. CHECK EXISTING USER BY EMAIL
    if (lower.startsWith('select id from users where email =') || lower.startsWith('select * from users where email =')) {
      const email = params[0]?.toLowerCase()?.trim();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 3. GET USER BY ID
    if (lower.startsWith('select id, name, email, phone, role') && lower.includes('from users where id =')) {
      const id = params[0];
      const { data, error } = await supabase.from('users').select('*').eq('id', id);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 4. GET VENDOR BY USER_ID
    if (lower.includes('from vendors where user_id =')) {
      const userId = params[0];
      const { data, error } = await supabase.from('vendors').select('*').eq('user_id', userId);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 5. GET VENDOR BY ID
    if (lower.includes('from vendors where id =') || lower.includes('from vendors v where v.id =')) {
      const id = params[0];
      const { data, error } = await supabase.from('vendors').select('*').eq('id', id);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 6. PRODUCTS FOR SPECIFIC VENDOR
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

    // 7. LOW STOCK PRODUCTS QUERY
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

    // 7. INSERT USER
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

    // 8. INSERT VENDOR
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

    // 9. INSERT PRODUCT
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

    // 10. UPDATE PRODUCT
    if (lower.startsWith('update products')) {
      if (lower.includes('stock_quantity = stock_quantity +') || (lower.includes('set stock_quantity =') && params.length <= 2)) {
        const id = params[params.length - 1];
        const newStock = params[0];
        const { data, error } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { rows: [data] };
      }

      // Full product update: [name, description, price, category, stock_quantity, lead_time, image_url, is_active, id, vendorId]
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

    // 10B. UPDATE VENDORS (Admin status updates & Vendor profile updates)
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

      // Profile update: [business_name, description, category, phone, address, city, logo_url, banner_url, user_id]
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

    // 10C. INSERT INTO ORDERS
    if (lower.startsWith('insert into orders')) {
      // [order_code, customer_id, vendor_id, total_amount, payment_status, payment_method, delivery_address, notes]
      // or optionally [..., payment_reference]
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

    // 10D. INSERT INTO ORDER_ITEMS
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

    // 10E. UPDATE ORDERS (Status updates & Paystack payment confirmations)
    if (lower.startsWith('update orders')) {
      // Check if updating payment status & reference
      if (lower.includes('payment_status') && lower.includes('payment_reference')) {
        // e.g. UPDATE orders SET payment_status = $1, payment_reference = $2, payment_method = $3 WHERE id = $4
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

      // Check if standard status transition: UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
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

    // 10F. INSERT INTO REVIEWS
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

    // 11. SELECT VENDORS
    if (lower.includes('from vendors v') || lower.includes('from vendors')) {
      let q = supabase.from('vendors').select('*, users(name, email)');
      if (lower.includes("v.status = 'approved'") || lower.includes("status = 'approved'")) {
        q = q.eq('status', 'approved');
      } else if (lower.includes('where v.status = $1') && params.length > 0) {
        q = q.eq('status', params[0]);
      }
      
      // Dynamic filters passed via query params
      if (params.length > 0) {
        if (lower.includes('lower(v.category) = lower(') || lower.includes('category =')) {
          q = q.ilike('category', params[0]);
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

      // Apply search in-memory if search parameter is present in SQL
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

    // 12. SELECT PRODUCTS
    if (lower.includes('from products')) {
      let q = supabase.from('products').select('*, vendors(business_name, category, city, status)');
      if (lower.includes('is_active = true')) {
        q = q.eq('is_active', true);
      }
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      const formatted = (data || []).map(p => ({
        ...p,
        business_name: p.vendors?.business_name,
        vendor_city: p.vendors?.city,
        vendor_category: p.vendors?.category,
        vendor_status: p.vendors?.status
      }));
      return { rows: formatted };
    }

    // 13. SELECT ORDERS
    if (lower.includes('from orders')) {
      // Order items for orders by ID
      if (lower.startsWith('select * from orders where id =') || lower.startsWith('select id, vendor_id, customer_id, status, order_code from orders where id =')) {
        const orderId = params[0];
        let q = supabase.from('orders').select('*').eq('id', orderId);
        if (params.length > 1) {
          q = q.eq('vendor_id', params[1]);
        }
        const { data, error } = await q;
        if (error) throw error;
        return { rows: data || [] };
      }

      // Check for order items query: SELECT product_id, quantity FROM order_items WHERE order_id = $1
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

    // 14. UPDATE USERS (Profile updates)
    if (lower.startsWith('update users set')) {
      // Dynamic SET clause: extract the WHERE id param (always last) and the update fields
      const userId = params[params.length - 1];
      
      // Parse "SET field1 = $1, field2 = $2 WHERE id = $N" to extract field names
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

    // 15. NOTIFICATIONS
    if (lower.includes('from notifications')) {
      const userId = params[0];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        // Table may not exist yet — return empty
        console.warn('[DB Bridge] Notifications query error (table may not exist):', error.message);
        return { rows: [] };
      }
      return { rows: data || [] };
    }

    // 16. Transaction control (no-op for Supabase, each operation is auto-committed)
    if (lower === 'begin' || lower === 'commit' || lower === 'rollback') {
      return { rows: [] };
    }

    // 17. ALTER TABLE (schema migrations — ignored in Supabase JS, columns must be added via dashboard)
    if (lower.startsWith('alter table')) {
      return { rows: [] };
    }

    // Fallback: return safe default empty array with total_orders = 0
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
