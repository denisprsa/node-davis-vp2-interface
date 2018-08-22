#!/bin/bash

sudo service ntp stop
sudo ntpdate -u si.pool.ntp.org
