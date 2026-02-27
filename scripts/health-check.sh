#!/bin/bash

# Health check script para verificar se as aplicações estão funcionando

set -e

echo "🏥 Health Check - OmniSeller"
echo "=============================="

# Configurações
LANDING_URL=${LANDING_URL:-"http://localhost:3000"}
WEB_URL=${WEB_URL:-"http://localhost:3000"}
TIMEOUT=${TIMEOUT:-10}

# Função para verificar URL
check_health() {
    local url=$1
    local name=$2
    
    echo "🔍 Verificando $name em $url..."
    
    if curl -f -s --max-time $TIMEOUT "$url" > /dev/null; then
        echo "✅ $name está funcionando"
        return 0
    else
        echo "❌ $name não está respondendo"
        return 1
    fi
}

# Função principal
main() {
    local all_healthy=true
    
    echo "⏰ Timeout configurado para ${TIMEOUT}s"
    echo ""
    
    # Verificar Landing Page
    if ! check_health "$LANDING_URL" "Landing Page"; then
        all_healthy=false
    fi
    
    echo ""
    
    # Verificar Web App
    if ! check_health "$WEB_URL" "Web App"; then
        all_healthy=false
    fi
    
    echo ""
    echo "=============================="
    
    if [ "$all_healthy" = true ]; then
        echo "🎉 Todas as aplicações estão saudáveis!"
        exit 0
    else
        echo "⚠️  Algumas aplicações apresentam problemas"
        exit 1
    fi
}

# Ajuda
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Health Check - OmniSeller"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Variáveis de ambiente:"
    echo "  LANDING_URL   URL da landing page (default: http://localhost:3000)"
    echo "  WEB_URL       URL da web app (default: http://localhost:3000)"
    echo "  TIMEOUT       Timeout em segundos (default: 10)"
    echo ""
    echo "Exemplos:"
    echo "  $0"
    echo "  LANDING_URL=https://landing.exemplo.com WEB_URL=https://app.exemplo.com $0"
    echo "  TIMEOUT=30 $0"
    exit 0
fi

# Executar verificação
main
