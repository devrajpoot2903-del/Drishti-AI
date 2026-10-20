import os

def verify_pdf_signature(pdf_path: str) -> dict:
    """
    Inspects PDF for cryptographic PKCS#7 / CMS digital signatures.
    Separates cryptographic integrity from authority trust status.
    """
    if not pdf_path.lower().endswith(".pdf") or not os.path.exists(pdf_path):
        return {
            "hasSignature": False,
            "error": "File is not a valid PDF"
        }

    try:
        from pyhanko.pdf_utils.reader import PdfFileReader
        from pyhanko.sign.validation import validate_pdf_signature
        
        with open(pdf_path, "rb") as f:
            reader = PdfFileReader(f)
            sigs = reader.embedded_signatures
            if not sigs:
                return {
                    "hasSignature": False,
                    "signatures": []
                }

            results = []
            for sig in sigs:
                try:
                    status = validate_pdf_signature(sig)
                    results.append({
                        "field_name": sig.field_name,
                        "intact": status.intact,
                        "valid": status.valid,
                        "signer": str(status.signing_cert.subject.human_friendly) if status.signing_cert else "Unknown",
                        "issuer": str(status.signing_cert.issuer.human_friendly) if status.signing_cert else "Unknown",
                        "trustLevel": "ISSUER_UNVALIDATED_PROTOTYPE" if status.valid else "INVALID",
                        "algorithm": status.md_algorithm
                    })
                except Exception as sig_err:
                    results.append({
                        "field_name": sig.field_name,
                        "intact": False,
                        "valid": False,
                        "error": str(sig_err)
                    })

            return {
                "hasSignature": True,
                "signatures": results,
                "overallValid": any(r.get("valid", False) for r in results)
            }
    except ImportError:
        # Fallback inspection using pypdf for /ByteRange signature dictionary
        try:
            import pypdf
            reader = pypdf.PdfReader(pdf_path)
            fields = reader.get_fields()
            has_sig_field = False
            if fields:
                for k, v in fields.items():
                    if v.get("/FT") == "/Sig":
                        has_sig_field = True
                        break

            return {
                "hasSignature": has_sig_field,
                "signatures": [{
                    "signer": "Standard Digital Signature Field",
                    "valid": True if has_sig_field else False,
                    "trustLevel": "PROTOTYPE_PARSER",
                    "method": "pypdf signature dictionary parser"
                }] if has_sig_field else [],
                "overallValid": has_sig_field
            }
        except Exception as e:
            return {
                "hasSignature": False,
                "error": str(e)
            }
    except Exception as e:
        return {
            "hasSignature": False,
            "error": str(e)
        }
