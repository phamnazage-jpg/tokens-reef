package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strings"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

// generateCodeHMAC generates HMAC-SHA256 signature, returning the first 8 hex characters.
// Used for RedeemCode and PromoCode.
func generateCodeHMAC(message, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(message))
	return hex.EncodeToString(h.Sum(nil))[:8]
}

// ValidateCodeSignature validates an instance signature appended to a code.
// Returns the raw code without the signature, or an error if validation fails.
// The code format is: rawCode.signature
func validateCodeSignature(codeWithSig string, secret string) (string, error) {
	parts := strings.Split(codeWithSig, ".")
	if len(parts) != 2 {
		return "", infraerrors.BadRequest("INVALID_CODE_FORMAT", "invalid code format: missing instance signature")
	}

	rawCode := parts[0]
	signature := parts[1]

	expectedSig := generateCodeHMAC(rawCode, secret)
	if !hmac.Equal([]byte(signature), []byte(expectedSig)) {
		return "", infraerrors.BadRequest("INVALID_CODE_SIGNATURE", "invalid code signature")
	}

	return rawCode, nil
}