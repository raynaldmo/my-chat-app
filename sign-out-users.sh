#!/bin/bash
CURL=/usr/bin/curl
SERVER=192.168.0.252:3000
CRED='username=test&passwd=test'
num=0
while [ $num -lt 10 ]
do
	# login
	$CURL -c cookiejar.txt -X POST $SERVER/login --data $CRED > /dev/null 2>&1
	$CURL -b cookiejar.txt -X POST $SERVER/admin/users/sign-out --data "name=test$num" > /dev/null 2>&1
	let num+=1
done
