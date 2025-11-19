#!/bin/bash

# Script de Rollback de Emergência
# Uso: bash scripts/rollback.sh [versão]

set -e

echo "🔄 ROLLBACK DE EMERGÊNCIA"
echo "========================"
echo ""

# Verificar se versão foi especificada
VERSION=${1:-HEAD~1}

echo "⚠️  ATENÇÃO: Este script irá reverter a aplicação para: $VERSION"
echo ""
read -p "Tem certeza? (yes/NO): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Rollback cancelado"
  exit 0
fi

echo ""
echo "🚀 Iniciando rollback..."
echo ""

# 1. Backup atual
echo "📦 Criando backup do estado atual..."
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
git branch $BACKUP_BRANCH
echo "✅ Backup criado: $BACKUP_BRANCH"
echo ""

# 2. Rollback frontend
echo "🔙 Revertendo frontend..."
git revert --no-commit HEAD
git commit -m "chore: emergency rollback to $VERSION"
git push origin main
echo "✅ Frontend revertido"
echo ""

# 3. Rollback edge functions (opcional)
read -p "Reverter edge functions? (yes/NO): " rollback_functions

if [ "$rollback_functions" = "yes" ]; then
  echo "🔙 Revertendo edge functions..."
  
  # Checkout versão anterior das functions
  git checkout $VERSION supabase/functions/
  
  # Re-deploy
  supabase functions deploy --no-verify-jwt
  
  echo "✅ Edge functions revertidas"
fi

echo ""

# 4. Rollback database (opcional e PERIGOSO)
read -p "⚠️  PERIGO: Reverter migrations do database? (yes/NO): " rollback_db

if [ "$rollback_db" = "yes" ]; then
  echo "⚠️  Revertendo database..."
  echo "ATENÇÃO: Isso pode causar perda de dados!"
  
  read -p "Digite 'CONFIRMAR' para continuar: " final_confirm
  
  if [ "$final_confirm" = "CONFIRMAR" ]; then
    # Aqui você deve ter um backup SQL para restaurar
    # Este é apenas um exemplo - ajuste conforme necessário
    
    echo "📥 Restaurando backup do database..."
    # psql $DATABASE_URL < backup.sql
    
    echo "✅ Database revertido (se aplicável)"
  else
    echo "❌ Rollback de database cancelado"
  fi
fi

echo ""

# 5. Notificar equipe
echo "📢 Notificando equipe..."

# Se você tem webhook do Slack configurado
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST $SLACK_WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d "{
      \"text\": \"🚨 ROLLBACK EXECUTADO\",
      \"attachments\": [{
        \"color\": \"danger\",
        \"fields\": [
          {\"title\": \"Versão\", \"value\": \"$VERSION\", \"short\": true},
          {\"title\": \"Data\", \"value\": \"$(date)\", \"short\": true},
          {\"title\": \"Backup\", \"value\": \"$BACKUP_BRANCH\", \"short\": false}
        ]
      }]
    }"
  
  echo "✅ Notificação enviada ao Slack"
else
  echo "⚠️  SLACK_WEBHOOK_URL não configurado - notificação manual necessária"
fi

echo ""

# 6. Verificação pós-rollback
echo "🔍 Verificando aplicação..."
echo ""

read -p "Executar smoke tests? (yes/NO): " run_tests

if [ "$run_tests" = "yes" ]; then
  echo "🧪 Executando smoke tests..."
  
  # Aguardar deploy completar
  echo "Aguardando 30s para deploy completar..."
  sleep 30
  
  # Testar endpoints principais
  BASE_URL=${BASE_URL:-"https://seu-dominio.com"}
  
  echo "Testing $BASE_URL..."
  curl -f -s -o /dev/null $BASE_URL && echo "✅ Home OK" || echo "❌ Home FAILED"
  curl -f -s -o /dev/null $BASE_URL/menu && echo "✅ Menu OK" || echo "❌ Menu FAILED"
  curl -f -s -o /dev/null $BASE_URL/plans && echo "✅ Plans OK" || echo "❌ Plans FAILED"
fi

echo ""
echo "✅ ROLLBACK CONCLUÍDO"
echo ""
echo "Próximos passos:"
echo "  1. Verificar aplicação está funcionando"
echo "  2. Investigar causa do problema original"
echo "  3. Criar hotfix se necessário"
echo "  4. Documentar incidente"
echo ""
echo "Para restaurar manualmente:"
echo "  git checkout $BACKUP_BRANCH"
echo ""
