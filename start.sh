#!/bin/bash
cd /Users/shenweizhang/Desktop/fenqian
source .venv/bin/activate
uvicorn server.main:app --reload
