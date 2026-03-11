# Deployment Guide

## Introduction

The FLAME project consists of two major components:
- **FLAME Hub**: The central component coordinating the nodes.
- **FLAME Node**: The component installed at data sites (hospitals, research centers) to execute federated learning tasks.

This guide contains instructions for deploying both components.

## Overview

### Hub Deployment

Instructions for deploying the FLAME Hub.

- **Production (Kubernetes)**
    - [Helm Chart Installation](/guide/deployment/hub-installation)
    - [Storage Setup (Mayastor) (optional)](/guide/deployment/hub-storage)
- **Development / Test**
    - [Hub Docker Compose](/guide/deployment/hub-docker-compose)

### Node Deployment

Instructions for deploying a FLAME Node.

**Tasks:**

- [Hub Registration](/guide/deployment/node-registration)
- Cluster Setup (choose one)
    - [microk8s](/guide/deployment/microk8s-quickstart)
    - [minikube](/guide/deployment/minikube-quickstart)
- [FLAME Node Installation](/guide/deployment/node-installation)
