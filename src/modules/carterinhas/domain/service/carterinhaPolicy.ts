export class CarterinhaPolicy {
    private VALIDADE_PADRAO_ANOS = 2;     
    private VALIDADE_PADRAO_MESSES = 6;     
    private VALIDADE_PADRAO_DIAS = 0;     
    
    calcularValidade(emissao: Date): Date {
        return new Date(emissao.getFullYear() + this.VALIDADE_PADRAO_ANOS, emissao.getMonth() + this.VALIDADE_PADRAO_MESSES, emissao.getDate() + this.VALIDADE_PADRAO_DIAS);
    }

    isValidadeValida(validade: Date): boolean {
        return validade > new Date();
    }
}