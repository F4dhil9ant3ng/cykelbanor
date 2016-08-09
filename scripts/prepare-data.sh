#!/bin/bash

OSRM_DIR=/home/per/Documents/Projects/osrm-backend/build
OSM_SLOPE="node /home/per/Documents/Projects/osm-slope/index.js"
DATA_DIR=/home/per/Documents/geodata
DATA=$DATA_DIR/sweden
DATA_OSM=$DATA.osm.pbf
DATA_OSRM=$DATA.osrm
DATA_SLOPE=$DATA"_slope.json"
PROFILE=./config/bicycle5.lua
#PROFILE=../osrm-backend/profiles/bicycle.lua

$OSM_SLOPE --cache_dir $DATA_DIR $DATA_OSM $DATA_SLOPE
$OSRM_DIR/osrm-extract -p $PROFILE $DATA_OSM && $OSRM_DIR/osrm-contract $DATA_OSRM
