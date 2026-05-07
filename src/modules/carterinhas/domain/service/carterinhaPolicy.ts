export class CarterinhaPolicy {
    private VALIDADE_PADRAO_ANOS = 2;     
    
    calcularValidade(emissao: Date): Date {
        return new Date(emissao.getFullYear() + this.VALIDADE_PADRAO_ANOS, emissao.getMonth(), emissao.getDate());
    }

    isValidadeValida(validade: Date): boolean {
        return validade > new Date();
    }
}