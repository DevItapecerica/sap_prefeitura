import type { PdfRenderer } from "../../../../core/contracts/pdf-renderer.js";

export interface CarterinhaRenderInput {
  name: string;
  entityData: {
    name: string;
    identidade: string;
    modalidade: string;
    cadastro: string;
    nascimento: string | null;
    endereco: string;
    numero: string;
    bairro: string;
    cep: string;
    obs: string;
    exame: string;
    foto: string | null;
  };
}

export type CarterinhaPdfGateway = PdfRenderer<CarterinhaRenderInput>;
