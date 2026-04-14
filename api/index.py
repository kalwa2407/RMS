import os
import sys

# Add the backend directory to python path so it can find the modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/backend')

from backend.server import app
