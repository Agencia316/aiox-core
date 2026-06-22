/**
 * DTOs de API — formato estável consumido pelo frontend, desacoplado da linha
 * do banco (datas como ISO string, valores monetários como number).
 */

export interface ProcessoDTO {
  id: string;
  cnj: string;
  clienteNome: string;
  area: string;
  tribunal: string;
  status: 'ativo' | 'suspenso' | 'arquivado' | 'baixado';
  fase: 'conhecimento' | 'recursal' | 'execucao' | 'cumprimento';
  valorCausa: number | null;
  createdAt: string;
}

export interface MovimentacaoDTO {
  id: string;
  processoId: string;
  data: string;
  titulo: string;
  resumoIa: string | null;
}

export type LeadColuna = 'novo' | 'qualificacao' | 'proposta' | 'negociacao' | 'ganho' | 'perdido';

export interface LeadDTO {
  id: string;
  nome: string;
  telefone: string;
  area: string;
  score: number;
  colunaFunil: LeadColuna;
  origem: 'whatsapp' | 'indicacao' | 'site' | 'anuncio' | 'organico';
  resumoIa: string | null;
}

export interface DashboardKpis {
  processosAtivos: number;
  prazosUrgentes: number;
  leadsNovos: number;
  receitaMes: number;
}

export interface FunilColuna {
  coluna: LeadColuna;
  total: number;
}

export interface DashboardDTO {
  kpis: DashboardKpis;
  funil: FunilColuna[];
  atividadeRecente: MovimentacaoDTO[];
}

export interface PrazoDTO {
  id: string;
  processoId: string | null;
  titulo: string;
  dataVencimento: string;
  urgente: boolean;
}

export interface MensagemWA {
  de: 'lead' | 'caio';
  texto: string;
  em: string;
}

export interface ConversaResumo {
  id: string;
  leadId: string;
  leadNome: string;
  leadTelefone: string;
  ultimaMensagem: MensagemWA | null;
  totalMensagens: number;
}

export interface ConversaDTO {
  id: string;
  leadId: string;
  leadNome: string;
  leadTelefone: string;
  leadArea: string;
  leadScore: number;
  mensagens: MensagemWA[];
}

export type DocumentoTipo = 'peticao' | 'contrato' | 'procuracao' | 'parecer' | 'outro';

export interface DocumentoDTO {
  id: string;
  processoId: string | null;
  titulo: string;
  conteudo: string;
  tipo: DocumentoTipo;
  criadoPorIa: boolean;
  createdAt: string;
}

export interface DocumentoResumo {
  id: string;
  processoId: string | null;
  titulo: string;
  tipo: DocumentoTipo;
  criadoPorIa: boolean;
  createdAt: string;
  preview: string;
}

export type RiscoNivel = 'baixo' | 'medio' | 'alto';

export interface ClienteRisco {
  nome: string;
  documento: string;
  tipoDocumento: 'CPF' | 'CNPJ';
  score: number;
  nivel: RiscoNivel;
  apontamentos: string[];
  fontes: string[];
  consultadoEm: string;
}

export type UserRole = 'owner' | 'admin' | 'advogado' | 'secretaria';

export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type CobrancaStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado';

export interface CobrancaDTO {
  id: string;
  valor: number;
  status: CobrancaStatus;
  createdAt: string;
}

export interface Mandado {
  tipo: string;
  tribunal: string;
  data: string;
  situacao: 'ativo' | 'cumprido' | 'revogado';
}

export interface ExecucaoPenal {
  processo: string;
  regime: string;
  situacao: string;
}

export interface BgcResultado {
  nome: string;
  cpf: string;
  limpo: boolean;
  mandados: Mandado[];
  execucoesPenais: ExecucaoPenal[];
  consultadoEm: string;
}
