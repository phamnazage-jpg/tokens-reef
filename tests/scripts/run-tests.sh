#!/bin/bash

# Sub2API Test Runner Script
# 
# Usage:
#   ./run-tests.sh           # Run all tests
#   ./run-tests.sh unit     # Run only unit tests
#   ./run-tests.sh e2e      # Run only E2E tests
#   ./run-tests.sh ci       # Run tests in CI mode

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

run_unit_tests() {
    log_info "Running backend unit tests..."
    cd "$PROJECT_ROOT/backend"
    go test -short ./...
    log_info "Unit tests completed!"
}

run_integration_tests() {
    log_info "Running frontend integration tests..."
    cd "$PROJECT_ROOT/frontend"
    pnpm test -- --run
    log_info "Integration tests completed!"
}

run_e2e_tests() {
    log_info "Running E2E tests..."
    cd "$SCRIPT_DIR"
    npx playwright test
    log_info "E2E tests completed!"
}

run_all_tests() {
    log_info "Running all tests..."
    
    run_unit_tests
    run_integration_tests
    run_e2e_tests
    
    log_info "All tests completed!"
}

run_ci_tests() {
    log_info "Running CI tests (without E2E)..."
    
    run_unit_tests
    run_integration_tests
    
    log_info "CI tests completed!"
}

# Main
case "${1:-all}" in
    unit)
        run_unit_tests
        ;;
    integration)
        run_integration_tests
        ;;
    e2e)
        run_e2e_tests
        ;;
    ci)
        run_ci_tests
        ;;
    all)
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {unit|integration|e2e|ci|all}"
        exit 1
        ;;
esac
