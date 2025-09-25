import { z } from "zod";
import { isCPF, isCNPJ } from 'validation-br'
const validateCpfCnpj = (num: string) => {
    if (num.length < 12) {
        return isCPF(num);
    }
    if (num.length > 11) {
        return isCNPJ(num);
    }
};

// Form login
export const signInSchema = z.object({
    cnpj: z.string({ error: "Digite o CPF/CNPJ." })
        .refine(value => validateCpfCnpj(value), { error: "CNPJ inválido!" }),
    password: z.string({ error: "Digite a senha" }),
});
export type SignInFormType = z.infer<typeof signInSchema>;

// Form check password
export const CheckPasswordSchema = z.object({
    senha: z.string({ error: "Digite sua senha." })
});
export type CheckPasswordFormType = z.infer<typeof CheckPasswordSchema>;

// register customers
export const customerSchema = z.object({
    cpfcnpj: z.string({ error: "Informe seu cpf" }),
    nomeCliente: z.string({ error: "Informe seu nome" }),
    enderecoCliente: z.string({ error: "Informe seu endereco" }),
    cepCliente: z.string({ error: "Informe seu cep" }),
    ufCliente: z.string({ error: "Informe seu estado" }),
    cidadeCliente: z.string({ error: "Informe sua cidade" }),
    celularCliente: z.string({ error: "Informe seu celular" }),
    emailCliente: z.email({ error: "Informe um e-mail válido" }),
    nascimentoCliente: z.string({ error: "Informe o nascimento" })
});
export type CustomerFormType = z.infer<typeof customerSchema>;

// register customers
export const AlterPasswordSchema = z.object({
    senhaAnterior: z.string({ error: "Informe a senha anterior" }),
    senha: z.string({ error: "Informe a nova senha" }),
    repitaSenha: z.string({ error: "Repita a nova asenha" }),
})
    .refine((value: any) => value.senha === value.repitaSenha,
        {
            error: 'As senhas são diferentes',
            path: ['repitaSenha']
        }
    );
export type AlterPasswordFormType = z.infer<typeof AlterPasswordSchema>;

// register customers
export const RegisterPasswordSchema = z.object({
    email: z.email({ error: "Informe um e-mail válido" }),
    celular: z.string({ error: "Informe o celular" }),
    senha: z.string({ error: "Informe a senha" }),
    repitaSenha: z.string({ error: "Repita a asenha" }),
})
    .refine((value: any) => value.senha === value.repitaSenha,
        {
            error: 'As senhas são diferentes',
            path: ['repitaSenha']
        }
    );
export type RegisterPasswordFormType = z.infer<typeof RegisterPasswordSchema>;

// register customers
export const CrediarySchema = z.object({
    nomeMae: z.string({ error: "Informe o nome da mãe" }),
    sexo: z.string({ error: "Informe o sexo" }),
    escolaridade: z.string({ error: "Informe sua escolaridade" }),
    localTrabalho: z.string({ error: "Informe o local de trabalho" }),
    estadoCivil: z.string({ error: "Informe o estado civil" }),
    nomeConjuge: z.string({ error: "Informe o nome do cônjuge" }),
    cpfConjuge: z.string({ error: "Informe o cpf do cônjuge" }),
    profissao: z.string({ error: "Selecione sua profissão" }),
    renda: z.string({ error: "Insira sua renda" }),
});
export type CrediaryFormType = z.infer<typeof CrediarySchema>;


