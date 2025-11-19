#!/bin/bash

# Script de limpeza de código para Fase 4
# Detecta e remove código não utilizado, dependências obsoletas, etc.

echo "🧹 Iniciando limpeza de código..."
echo ""

# 1. Verificar dependências não utilizadas
echo "📦 Verificando dependências não utilizadas..."
npx depcheck --ignores="@types/*,vitest,@vitest/*,@playwright/*,eslint*,typescript,vite"

echo ""

# 2. Detectar código morto
echo "💀 Detectando código não importado..."
npx unimported

echo ""

# 3. Verificar código duplicado
echo "📋 Verificando código duplicado..."
npx jscpd src/ --min-lines 10 --min-tokens 50 --ignore "**/*.test.*,**/*.spec.*"

echo ""

# 4. Verificar imports não utilizados (TypeScript)
echo "🔍 Verificando imports não utilizados..."
npx ts-prune | head -20

echo ""

# 5. Verificar console.logs em produção
echo "📝 Verificando console.logs..."
CONSOLE_LOGS=$(grep -r "console\." src/ --include="*.tsx" --include="*.ts" --exclude-dir="__tests__" | wc -l)
echo "  Encontrados $CONSOLE_LOGS console.* statements"

if [ $CONSOLE_LOGS -gt 0 ]; then
  echo "  ⚠️  Existem console.logs no código de produção"
  echo "  Nota: Terser deve remover em build de produção"
fi

echo ""

# 6. Verificar TODOs sem issue
echo "📌 Verificando TODOs..."
TODO_COUNT=$(grep -r "TODO" src/ --include="*.tsx" --include="*.ts" | wc -l)
echo "  Encontrados $TODO_COUNT TODOs"

if [ $TODO_COUNT -gt 5 ]; then
  echo "  ⚠️  Muitos TODOs. Considere criar issues:"
  grep -r "TODO" src/ --include="*.tsx" --include="*.ts" | head -10
fi

echo ""

# 7. Verificar código comentado
echo "💬 Verificando código comentado..."
COMMENTED_CODE=$(grep -rE "^\s*//\s*(const|let|var|function|import|export)" src/ --include="*.tsx" --include="*.ts" | wc -l)
echo "  Encontradas $COMMENTED_CODE linhas de código comentado"

if [ $COMMENTED_CODE -gt 10 ]; then
  echo "  ⚠️  Muito código comentado. Considere remover."
fi

echo ""

# 8. Verificar tamanho de arquivos grandes
echo "📏 Verificando arquivos grandes..."
find src/ -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -10

echo ""

# 9. Resumo
echo "✅ Limpeza de código concluída!"
echo ""
echo "Próximos passos:"
echo "  1. Revisar dependências não utilizadas"
echo "  2. Remover código morto"
echo "  3. Refatorar código duplicado"
echo "  4. Converter TODOs em issues"
echo "  5. Remover código comentado"

exit 0
