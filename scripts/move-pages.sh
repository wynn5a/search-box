#!/bin/bash

# Create the [locale] directory if it doesn't exist
mkdir -p src/app/[locale]

# Move all pages and their parent directories to [locale]
mv src/app/clusters src/app/[locale]/
mv src/app/page.tsx src/app/[locale]/
