// // src/pages/create-admin-test.tsx
// import { useState } from 'react';

// export default function CreateAdminTest() {
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');

//   const createAdmin = async () => {
//     setLoading(true);
//     setMessage('Creating admin user...');
    
//     try {
//       const response = await fetch('/api/create-admin', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           email: 'admin@fugajipro.com',
//           password: 'admin123!',
//         }),
//       });

//       const data = await response.json();
//       setMessage(JSON.stringify(data, null, 2));
//     } catch (error) {
//       setMessage(`Error: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
//       <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
//         <h1 className="text-2xl font-bold mb-6">Create Admin User</h1>
//         <button
//           onClick={createAdmin}
//           disabled={loading}
//           className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
//         >
//           {loading ? 'Creating...' : 'Create Admin User'}
//         </button>
//         {message && (
//           <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto max-h-60">
//             <pre className="text-sm">{message}</pre>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }