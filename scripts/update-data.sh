#!/bin/bash

OSRM_DIR=/home/per/Documents/Projects/osrm-backend/build
DATA_DIR=/home/per/Documents/geodata
DATA=$DATA_DIR/sweden.osm.pbf

wget -O $DATA http://download.geofabrik.de/europe/sweden-latest.osm.pbf

./scripts/prepare-data.sh
