import { useRef, useState, useEffect, type KeyboardEvent, type ClipboardEvent } from "react";

interface InviteCodeInputProps {
    onComplete: (code: string) => void;
    onError?: (message: string) => void;
    disabled?: boolean;
    autoFocus?: boolean;
}

/**
 * Input de código de convite formatado (6 dígitos)
 * - Auto-foco no próximo campo
 * - Backspace volta para campo anterior
 * - Cole código inteiro e distribui automaticamente
 * - Valida caracteres (A-Z, 0-9, case-insensitive)
 */
export function InviteCodeInput({ onComplete, onError, disabled = false, autoFocus = true }: InviteCodeInputProps) {
    const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-focus no primeiro campo ao montar
    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus]);

    // Valida se é um caractere válido (A-Z, 0-9)
    const isValidChar = (char: string): boolean => {
        return /^[A-Z0-9]$/i.test(char);
    };

    // Atualiza um dígito específico
    const handleChange = (index: number, value: string) => {
        if (disabled) return;

        // Pega apenas o último caractere digitado
        const char = value.slice(-1).toUpperCase();

        if (value === "" || isValidChar(char)) {
            const newCode = [...code];
            newCode[index] = char;
            setCode(newCode);

            // Se digitou algo e não é o último campo, vai pro próximo
            if (char && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }

            // Se completou o código, chama callback
            if (char && index === 5) {
                const fullCode = newCode.join("");
                if (fullCode.length === 6) {
                    onComplete(fullCode);
                }
            }
        } else if (onError) {
            onError("Use apenas letras e números (A-Z, 0-9)");
        }
    };

    // Handle backspace
    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        if (e.key === "Backspace") {
            e.preventDefault();
            const newCode = [...code];

            if (code[index]) {
                // Se tem valor, limpa
                newCode[index] = "";
                setCode(newCode);
            } else if (index > 0) {
                // Se não tem valor, volta pro anterior e limpa ele
                newCode[index - 1] = "";
                setCode(newCode);
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < 5) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle paste (colar código completo)
    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").toUpperCase().replace(/\s/g, "");

        if (pastedData.length === 6 && /^[A-Z0-9]{6}$/.test(pastedData)) {
            const newCode = pastedData.split("");
            setCode(newCode);
            inputRefs.current[5]?.focus();
            onComplete(pastedData);
        } else if (onError) {
            onError("Código inválido. Use 6 caracteres (A-Z, 0-9)");
        }
    };

    return (
        <div className="flex items-center justify-center gap-2">
            {code.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={`
                        h-14 w-12 rounded-lg border-2 text-center text-2xl font-bold uppercase
                        transition-all
                        ${digit
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-soft bg-surface text-default"
                        }
                        ${disabled ? "cursor-not-allowed opacity-50" : ""}
                        focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20
                        hover:border-brand/50
                    `}
                    aria-label={`Dígito ${index + 1} do código`}
                />
            ))}
        </div>
    );
}
