#!/usr/bin/env bash

DIRECTORY=/Users/yashu/projects/blockhash-tree/blockhash-tree/local/docker

if [ -d $DIRECTORY ]
then
  echo continue to delete all files in $DIRECTORY. files:
  ls -l $DIRECTORY
  echo "press enter froto apply or ctrl-c to quit"
    read -r

  # delete the docker temporary files
  rm -rf $DIRECTORY/**
  mkdir $DIRECTORY/node-1 $DIRECTORY/node-2 $DIRECTORY/node-3

  echo "creating doge-peers network"
#  # make the network
  docker network create doge-peers
  docker stop doge_node_1
  docker stop doge_node_2
  docker stop doge_node_observer

  # run the 2 containers

  echo "starting doge_node_1 on doge-peers network"
  docker run --network doge-peers --name doge_node_1 --rm -d -v $DIRECTORY/volumes/doge/node-1:/root/.dogecoin doge-regtest
  echo "starting doge_node_2 on doge-peers network"
  docker run --network doge-peers --name doge_node_2 --rm -d -v $DIRECTORY/volumes/doge/node-2:/root/.dogecoin doge-regtest
  echo "starting doge_node_observer on doge-peers network"
  docker run --network doge-peers --name doge_node_observer --rm -d -p 22222:28332 -v $DIRECTORY/volumes/doge/node-3:/root/.dogecoin doge-regtest -debug=1 -zmqpubhashblock=tcp://0.0.0.0:28332 -zmqpubhashtx=tcp://0.0.0.0:28332 -zmqpubrawblock=tcp://0.0.0.0:28332 -zmqpubrawtx=tcp://0.0.0.0:28332 -zmqpubsequence=tcp://0.0.0.0:28332

  echo ""
  # connect the 2 containers to each other
  sleep 2
  echo "adding doge_node_2 to doge_node_1 peer list"
  docker exec doge_node_1 dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest addnode "doge_node_2" "add"
  echo ""
  sleep 1
  echo "adding doge_node_observer to doge_node_1 peer list"
  docker exec doge_node_1 dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest addnode "doge_node_observer" "add"
  echo ""
  sleep 1
  echo "adding doge_node_1 to doge_node_2 peer list"
  docker exec doge_node_2 dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest addnode "doge_node_1" "add"
  echo ""
  sleep 1
  echo "adding doge_node_observer to doge_node_2 peer list"
  docker exec doge_node_2 dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest addnode "doge_node_observer" "add"
  echo ""
  sleep 1
  echo "adding doge_node_1 to doge_node_observer peer list"
  docker exec doge_node_observer dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest addnode "doge_node_1" "add"
  echo ""
  sleep 1
  echo "adding doge_node_2 to doge_node_observer peer list"
  docker exec doge_node_observer dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest addnode "doge_node_2" "add"
  echo ""
  sleep 1

  echo "pausing to allow user to get peer info. execute the following to getpeerinfo. Press enter to continue"
  echo "docker exec doge_node_observer dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest getpeerinfo"
    read -r

  echo "mining 5 blocks on doge_node_1"
  docker exec doge_node_1 dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest generate 5
  echo "mining 5 blocks on doge_node_2"
  docker exec doge_node_2 dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest generate 5

  echo ""
  sleep 2

  echo "pausing to allow user to get peer info. execute the following to getchaintips. Press enter to continue"
  echo "docker exec doge_node_observer dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest getchaintips"
    read -r

  echo "disconnecting doge_node_1 from doge-peers network"
  docker network disconnect doge-peers doge_node_1
  echo "mining 3 blocks on doge_node_1 (disconnected from peers)"
  docker exec doge_node_1 dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest generate 3
  echo ""
  echo "pausing to allow user to get peer info. execute the following to getchaintips. Press enter to continue"
  echo "docker exec doge_node_observer dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest getchaintips"
    read -r
  echo "mining 3 blocks on doge_node_2 (still connected to same network as doge_node_observer)"
  docker exec doge_node_2 dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest generate 3
  echo ""
  echo "pausing to allow user to get peer info. execute the following to getchaintips. Press enter to continue"
  echo "docker exec doge_node_observer dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest getchaintips"
    read -r
  echo "re-connecting doge_node_1 to doge-peers network"
  docker network connect doge-peers doge_node_1
  echo ""
  sleep 2
  echo "pausing to allow user to get peer info. execute the following to getchaintips. Press enter to continue"
  echo "docker exec doge_node_observer dogecoin-cli --rpcuser=user --rpcpassword=hackme -regtest getchaintips"
    read -r

  echo "press enter finish and clean up"
    read -r
  docker stop doge_node_1
  docker stop doge_node_2
  docker stop doge_node_observer
  docker network rm doge-peers
  echo "done"
else
  echo $DIRECTORY does not exist, creating it now
  mkdir -p $DIRECTORY
fi

