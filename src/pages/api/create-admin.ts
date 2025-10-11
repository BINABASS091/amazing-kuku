// // src/pages/api/create-admin.ts
// import { createClient } from '@supabase/supabase-js';
// import type { NextApiRequest, NextApiResponse } from 'next';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// const supabase = createClient(supabaseUrl, supabaseKey);

// // export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   try {
//     const { email, password } = req.body;

//     // Create auth user
//     const { data, error } = await supabase.auth.admin.createUser({
//       email,
//       password,
//       email_confirm: true,
//       user_metadata: { role: 'ADMIN' }
//     });

//     if (error) throw error;

//     if (data.user) {
//       // Create profile in public.users
//       const { error: profileError } = await supabase
//         .from('users')
//         .upsert({
//           id: data.user.id,
//           email,
//           role: 'ADMIN',
//           full_name: 'Admin User',
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString()
//         }, { onConflict: 'id' });

//       if (profileError) throw profileError;
      
//       return res.status(200).json({ success: true, user: data.user });
//     }
//   } catch (error) {
//     console.error('Error creating admin user:', error);
//     return res.status(500).json({ error: 'Failed to create admin user' });
//   }
// }
