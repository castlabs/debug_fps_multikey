#!/bin/bash

shaka-packager \
  'in=src/1080p_4M_30fps.mp4,stream=video,init_segment=pkg/1080p_init.mp4,segment_template=pkg/1080p_$Number$.mp4,drm_label=HD' \
  'in=src/360p_1M_30fps.mp4,stream=video,init_segment=pkg/360p_init.mp4,segment_template=pkg/360p_$Number$.mp4,drm_label=SD' \
  --segment_duration 4 \
  --hls_master_playlist_output pkg/master.m3u8 \
  --clear_lead 0 \
  --protection_scheme cbcs \
  --protection_systems FairPlay \
  --enable_raw_key_encryption \
  --mp4_include_pssh_in_stream=false \
  --keys label=HD:key_id=00000000000000000000000000000011:key=00000000000000000000000000000011:iv=00000000000000000000000000000011,\
label=SD:key_id=00000000000000000000000000000010:key=00000000000000000000000000000010:iv=00000000000000000000000000000010

