#!/bin/bash

# Script de instalación rápida para el sistema de testing

echo "================================================"
echo "  INSTALACIÓN DE SISTEMA DE TESTING"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Instalando dependencias de testing...${NC}"
npm install --save-dev jest supertest @types/jest

echo ""
echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

echo -e "${BLUE}🧪 Ejecutando tests de prueba...${NC}"
npm test

echo ""
echo "================================================"
echo -e "${GREEN}✅ INSTALACIÓN COMPLETADA${NC}"
echo "================================================"
echo ""
echo "Comandos disponibles:"
echo "  npm test              - Ejecutar todos los tests"
echo "  npm run test:watch    - Ejecutar en modo watch"
echo "  npm run test:coverage - Ejecutar con cobertura"
echo "  npm run test:unit     - Solo tests unitarios"
echo "  npm run test:integration - Solo tests de integración"
echo "  npm run test:e2e      - Solo tests end-to-end"
echo ""
