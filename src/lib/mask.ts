function maskCep(value: string) {
    if (value) {
        value = value.replace(/\D/g, "");
        value = value.replace(/^(\d{5})(\d)/, "$1-$2");
        return value;
    }
}

function maskPhone(value: string) {
    if (typeof value !== "undefined" && value) {
        if (value.length < 11) {
            value = value.replace(/\D/g, "");
            value = value.replace(/^(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
            return value;
        } else {
            value = value.replace(/\D/g, "");
            value = value.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
            return value;
        }
    }
}

function maskWhatsApp(value: string) {
    if (typeof value !== "undefined" && value) {
        value = value.replace(/\D/g, "");
        value = value.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})/, "$1$2$3$4");
        return value;
    }
}

function maskDate(value: string) {
    if (typeof value !== "undefined" && value) {
        value = value.replace(/\D/g, "");
        value = value.replace(/^(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
        return value;
    }
}

function maskCpfCnpj(value: string) {
    if (typeof value !== "undefined" && value) {
        if (value.length < 12) {
            value = value.replace(/\D/g, "");
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            return value;
        } else {
            value = value.replace(/\D/g, "");
            value = value.replace(
                /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                "$1.$2.$3/$4-$5",
            );
            return value;
        }
    }
}

function maskCnpj(value: string) {
    if (typeof value !== "undefined" && value) {
        value = value.replace(/\D/g, "");
        value = value.replace(
            /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            "$1.$2.$3/$4-$5",
        );
        return value;
    }
}

function unMask(value: any) {
    if (typeof value !== "undefined" && value) {
        value = value.replace(/\D/g, "");
        return value;
    }
}

function maskMoney(value: string) {
    if (typeof value !== "undefined" && value) {
        var valorAlterado = value;
        valorAlterado = valorAlterado.replace(/\D/g, ""); // Remove todos os não dígitos
        valorAlterado = valorAlterado.replace(/(\d+)(\d{2})$/, "$1,$2"); // Adiciona a parte de centavos
        valorAlterado = valorAlterado.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1."); // Adiciona pontos a cada três dígitos
        valorAlterado = valorAlterado;
        return value = valorAlterado;
    }
}


function maskMoneyDot(value: any) {
    if (typeof value !== "undefined" && value) {
        var valorAlterado = value;
        valorAlterado = valorAlterado.replace(/\D/g, ""); // Remove todos os não dígitos
        valorAlterado = valorAlterado.replace(/(\d+)(\d{2})$/, "$1.$2"); // Adiciona a parte de centavos
        valorAlterado = valorAlterado;
        return value = valorAlterado;
    }
}

export { maskCep, maskPhone, maskDate, maskCpfCnpj, maskCnpj, unMask, maskMoney, maskMoneyDot, maskWhatsApp };