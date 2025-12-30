#!/bin/bash
# Build script for Render deployment
# This script is used during the build process on Render

set -e  # Exit on error

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Build completed successfully!"

