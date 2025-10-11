#!/bin/bash

# Install frontend dependencies
cd /home/kilimanjaro/Desktop/amazing-kuku
npm install @radix-ui/react-tabs date-fns @radix-ui/react-toast lucide-react

# Install TypeScript types
npm install --save-dev @types/node @types/react @types/react-dom @types/react-router-dom

echo "Dependencies installed successfully!"

# Create required directories
mkdir -p src/lib/utils

# Create a basic utils file if it doesn't exist
if [ ! -f "src/lib/utils.ts" ]; then
  cat > src/lib/utils.ts << 'EOL'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOL
  
  echo "Created utils.ts with cn utility function"
fi

echo "Setup complete!"
