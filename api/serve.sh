#!/bin/bash
exec gunicorn --chdir api  -b :5000 app:app