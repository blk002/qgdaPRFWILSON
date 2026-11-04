import LEI_SECA_CTB_RAW from './leiSecaCTB.json';
import LEI_SECA_CONTRAN_RAW from './leiSecaCONTRAN.json';

export type QuestionCategory = 'CTB' | 'CONTRAN';

export interface ArtigoLeiSeca {
  id: string;
  numero: string;
  capitulo: string;
  dispositivo: string;
  texto: string;
}

export interface ArtigoLeiSecaCONTRAN {
  id: string;
  resolucao: string;
  numeroRes: string;
  numero: string;
  assunto: string;
  dispositivo: string;
  texto: string;
}

export const LEI_SECA_CTB: ArtigoLeiSeca[] = LEI_SECA_CTB_RAW as ArtigoLeiSeca[];
export const LEI_SECA_CONTRAN: ArtigoLeiSecaCONTRAN[] = LEI_SECA_CONTRAN_RAW as ArtigoLeiSecaCONTRAN[];

export interface PRFTopicMetadata {
  id: string;
  category: QuestionCategory;
  name: string;
  legalScope: string;
  guideline: string;
}

export interface ActiveRoundQuestion {
  id: string;
  uniqueHash: string;
  category: QuestionCategory;
  topic: string;
  legalBasis: string;
  statement: string;
  answer: boolean; // true = CERTO, false = ERRADO
  explanation: string;
  wasAiRewritten?: boolean;
  articleText?: string;
}

// Catálogo de Tópicos do Edital PRF
export const PRF_TOPICS_CATALOG: PRFTopicMetadata[] = [
  // ================= CTB =================
  {
    id: 'ctb-snt',
    category: 'CTB',
    name: 'CTB - Sistema Nacional de Trânsito e Competências da PRF (Art. 20)',
    legalScope: 'Arts. 1º a 25 do CTB (destaque Art. 20)',
    guideline: 'Art. 20: Competências privativas da PRF em rodovias federais: patrulhamento ostensivo, lavratura de TCO, fiscalizar, multar e aplicar medidas administrativas, levantamento de local de sinistro, suspensão do direito de dirigir quando prevista na infração (Lei 14.071/2020) e perícia administrativa no local do sinistro (Lei 14.229/2021).',
  },
  {
    id: 'ctb-circulacao-regras',
    category: 'CTB',
    name: 'CTB - Normas Gerais de Circulação e Conduta',
    legalScope: 'Arts. 26 a 67 do CTB',
    guideline: 'Preferência de passagem em cruzamentos e rotatórias (Art. 29), circulação pela direita, ultrapassagens pela contramão, distância de segurança lateral (1,5m) e frontal, uso de luzes e faróis diurnos em pista simples.',
  },
  {
    id: 'ctb-motorista-prof',
    category: 'CTB',
    name: 'CTB - Condução por Motoristas Profissionais',
    legalScope: 'Arts. 67-A a 67-E do CTB',
    guideline: 'Tempo máximo ininterrupto de direção (transporte de passageiros e carga), intervalo obrigatório de descanso (11h diárias, 30 min a cada 4h/5h30) e registro em cronotacógrafo.',
  },
  {
    id: 'ctb-pedestres-ciclistas',
    category: 'CTB',
    name: 'CTB - Pedestres e Veículos Não Motorizados',
    legalScope: 'Arts. 68 a 71 do CTB',
    guideline: 'Prioridade do pedestre na faixa, travessia em rodovias, circulação de ciclistas e distância lateral mínima de 1,5m para ultrapassagem de bicicleta.',
  },
  {
    id: 'ctb-sinalizacao',
    category: 'CTB',
    name: 'CTB - Sinalização de Trânsito e Engenharia Viária',
    legalScope: 'Arts. 80 a 95 do CTB',
    guideline: 'Ordem de prevalência das normas (ordens do agente de trânsito prevalecem sobre semáforo e placas), sinalização vertical de regulamentação, advertência e horizontal.',
  },
  {
    id: 'ctb-veiculos-equipamentos',
    category: 'CTB',
    name: 'CTB - Classificação e Equipamentos dos Veículos',
    legalScope: 'Arts. 96 a 113 do CTB',
    guideline: 'Classificação quanto à tração, espécie e categoria. Equipamentos obrigatórios, exigências de segurança e registro das características do veículo.',
  },
  {
    id: 'ctb-identificacao-placas',
    category: 'CTB',
    name: 'CTB - Identificação Veicular e Placas',
    legalScope: 'Arts. 114 a 117 do CTB',
    guideline: 'Gravação do chassi (VIN), placas dianteiras e traseiras, identificação de veículos de duas rodas e proibições de alterações.',
  },
  {
    id: 'ctb-registro-licenciamento',
    category: 'CTB',
    name: 'CTB - Registro, Licenciamento e Transferência Eletrônica (Art. 123)',
    legalScope: 'Arts. 118 a 135 do CTB',
    guideline: 'Art. 123: Expedição de novo CRV e transferência de propriedade 100% eletrônica pela Lei 15.153/2025. Porte de CRLV digital (CRLV-e / ATPV-e). Baixa de veículos irrecuperáveis e clonados.',
  },
  {
    id: 'ctb-habilitacao-cnh',
    category: 'CTB',
    name: 'CTB - Habilitação, Categorias, Validade e Identidade (Arts. 140 a 160)',
    legalScope: 'Arts. 140 a 160 do CTB',
    guideline: 'Art. 140 requisitos; Art. 143: categoria B autorizada a conduzir veículo elétrico ou híbrido com PBT de até 4.250 kg pela Lei 15.503/2026; Art. 147 exame médico (10 anos <50, 5 anos 50-69, 3 anos 70+); Art. 148 Permissão para Dirigir (PPD); Art. 159 CNH física ou digital válida expressamente como identidade oficial pela Lei 15.428/2026.',
  },
  {
    id: 'ctb-toxicologico',
    category: 'CTB',
    name: 'CTB - Exame Toxicológico Periódico e 1ª Habilitação (Art. 148-A)',
    legalScope: 'Arts. 148-A e 165-B do CTB',
    guideline: 'Art. 148-A: Exame toxicológico de larga janela obrigatório a cada 2 anos e meio para C, D e E com menos de 70 anos, e agora exigido também na 1ª habilitação para categorias A e B pela Lei 15.153/2025. Infração gravíssima (Arts. 165-B e 165-D).',
  },
  {
    id: 'ctb-penalidades',
    category: 'CTB',
    name: 'CTB - Penalidades, Pontuação e Suspensão da CNH',
    legalScope: 'Arts. 256 a 268 do CTB',
    guideline: 'Diferença entre penalidade e medida administrativa. Escalonamento de pontuação para suspensão da CNH (20, 30 ou 40 pontos conforme gravíssimas). Regra fixa de 40 pontos para condutor com EAR. Advertência por escrito para infrações leves ou médias.',
  },
  {
    id: 'ctb-medidas-adm',
    category: 'CTB',
    name: 'CTB - Medidas Administrativas: Retenção e Remoção',
    legalScope: 'Arts. 269 a 279-A do CTB',
    guideline: 'Medidas administrativas aplicáveis pelo agente da PRF: retenção do veículo (saneamento da irregularidade no local), remoção para depósito, recolhimento de documentos e transbordo de carga.',
  },
  {
    id: 'ctb-infracoes-alcool',
    category: 'CTB',
    name: 'CTB - Infrações: Alcoolemia e Recusa ao Teste',
    legalScope: 'Arts. 165 e 165-A do CTB',
    guideline: 'Dirigir sob efeito de álcool ou substância psicoativa (Art. 165) e recusa ao etilômetro ou perícia (Art. 165-A). Multa gravíssima (10x), suspensão do direito de dirigir por 12 meses e retenção do veículo.',
  },
  {
    id: 'ctb-infracoes-velocidade',
    category: 'CTB',
    name: 'CTB - Infrações: Velocidade e Ultrapassagem',
    legalScope: 'Arts. 202, 203 e 218 do CTB',
    guideline: 'Excesso de velocidade (até 20% média, 20%-50% grave, acima de 50% gravíssima com suspensão imediata). Ultrapassagem pela contramão em linha contínua amarela.',
  },
  {
    id: 'ctb-infracoes-especie',
    category: 'CTB',
    name: 'CTB - Infrações: Celular, Cinto, Capacete e Crianças',
    legalScope: 'Arts. 167, 168, 244 e 252 do CTB',
    guideline: 'Segurar ou manusear celular ao volante (infração gravíssima). Não usar cinto (grave). Conduzir moto transportando criança menor de 10 anos (gravíssima). Transporte de crianças sem cadeirinha (gravíssima).',
  },
  {
    id: 'ctb-processo-adm',
    category: 'CTB',
    name: 'CTB - Processo Administrativo e Recursos no SNT',
    legalScope: 'Arts. 280 a 290 do CTB',
    guideline: 'Auto de infração de trânsito (AIT), prazo decadencial de expedição da notificação da autuação (30 dias sob pena de arquivamento), defesa prévia, JARI e CETRAN.',
  },
  {
    id: 'ctb-crimes-geral',
    category: 'CTB',
    name: 'CTB - Crimes de Trânsito: Parte Geral e Agravantes (Art. 298)',
    legalScope: 'Arts. 291 a 301 do CTB',
    guideline: 'Aplicação subsidiária do Código Penal e Lei 9.099/95. Art. 298: Circunstâncias agravantes (faixa de pedestres, sem CNH, veículo de transporte coletivo, adulterado). Vedação de prisão em flagrante se prestar socorro imediato (Art. 301).',
  },
  {
    id: 'ctb-crimes-homicidio',
    category: 'CTB',
    name: 'CTB - Crimes: Homicídio Culposo e Lesão Corporal (Arts. 302 e 303)',
    legalScope: 'Arts. 302 e 303 do CTB',
    guideline: 'Art. 302: Homicídio culposo na direção de veículo (aumento na faixa de pedestres, calçada e sem CNH). Formas qualificadas por embriaguez ou drogas (reclusão de 5 a 8 anos). Art. 303: Lesão corporal culposa.',
  },
  {
    id: 'ctb-crimes-alcool-fuga',
    category: 'CTB',
    name: 'CTB - Crimes: Embriaguez ao Volante e Fuga de Local (Arts. 304, 305 e 306)',
    legalScope: 'Arts. 304, 305 e 306 do CTB',
    guideline: 'Art. 306: Crime de embriaguez ao volante (perigo abstrato, >= 0,30 mg/L ar alveolar ou >= 6 dg/L sangue). Art. 304: Omissão de socorro, mesmo se terceiro prestou socorro. Art. 305: Fuga do local do sinistro para fugir à responsabilidade penal/civil.',
  },
  {
    id: 'ctb-crimes-racha',
    category: 'CTB',
    name: 'CTB - Crimes: Racha, Perigo de Dano e Fraude no Sinistro (Arts. 308 a 312)',
    legalScope: 'Arts. 308 a 312-B do CTB',
    guideline: 'Art. 308: Racha / disputa automobilística não autorizada; Art. 309: Dirigir sem CNH gerando perigo concreto de dano; Art. 310: Entregar veículo a pessoa não habilitada; Art. 311: Velocidade incompatível junto a escolas e hospitais gerando perigo de dano; Art. 312: Inovação artificiosa no local de sinistro para enganar a perícia policial.',
  },

  // ================= CONTRAN (RESOLUÇÕES VIGENTES CONSOLIDADAS) =================
  {
    id: 'contran-1031',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 1.031/2026 (Fiscalização de Alcoolemia e Substâncias)',
    legalScope: 'Resolução CONTRAN nº 1.031/2026 (Revogou a Res. 432/2013)',
    guideline: 'Procedimentos de fiscalização do consumo de álcool e substâncias psicoativas pela PRF: medição por etilômetro (limites, margem de erro e valor considerado), constatação por sinais de alteração da capacidade psicomotora e recusa ao teste.',
  },
  {
    id: 'contran-1020',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 1.020/2025 (Processo de Habilitação e Condutor Estrangeiro)',
    legalScope: 'Resolução CONTRAN nº 1.020/2025 (Revogou a Res. 789/2020 e Res. 360/2010)',
    guideline: 'Diretrizes consolidadas para processo de formação, habilitação e exames de condutores no SNT, faltas eliminatórias, requisitos para categorias e direção por condutores estrangeiros em território nacional.',
  },
  {
    id: 'contran-1027',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 1.027/2026 (Registro, Licenciamento e Transferência Digital)',
    legalScope: 'Resolução CONTRAN nº 1.027/2026 (Revogou a Res. 809/2020)',
    guideline: 'Procedimentos 100% digitais para emissão do Certificado de Registro de Veículo (CRV-e), Certificado de Licenciamento Anual (CRLV-e) e Autorização para Transferência de Propriedade (ATPV-e), extinguindo o documento em papel.',
  },
  {
    id: 'contran-970',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 970/2022 (Sistemas de Iluminação e Faróis)',
    legalScope: 'Resolução CONTRAN nº 970/2022 (Substituiu as Res. 227/2007 e 667/2017)',
    guideline: 'Requisitos técnicos dos sistemas de iluminação e sinalização de veículos: uso de DRL (luz de rodagem diurna), farol baixo em rodovias de pista simples, cores de lâmpadas permitidas e proibição de substituição de lâmpadas dos faróis por outras que não atendam às normas.',
  },
  {
    id: 'contran-993',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 993/2023 (Equipamentos Obrigatórios dos Veículos)',
    legalScope: 'Resolução CONTRAN nº 993/2023 (Substituiu a Res. 14/1998)',
    guideline: 'Rol consolidado de equipamentos obrigatórios para a frota de veículos automotores, reboques e semirreboques: cinto de segurança, espelhos retrovisores, triângulo, chave de roda, extintor e encosto de cabeça.',
  },
  {
    id: 'contran-945',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 945/2022 (Amarração e Fixação de Cargas)',
    legalScope: 'Resolução CONTRAN nº 945/2022 (Substituiu a Res. 552/2015)',
    guideline: 'Requisitos de segurança para amarração de cargas em caminhões e semirreboques: uso de cintas têxteis, correntes ou cabos de aço com trava de segurança; proibição expressa de cordas de fibra sintética para fixação da carga.',
  },
  {
    id: 'contran-946',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 946/2022 (Transporte de Cargas Sólidas a Granel)',
    legalScope: 'Resolução CONTRAN nº 946/2022 (Substituiu a Res. 441/2013)',
    guideline: 'Exigência de cobertura total por lona ou dispositivo similar nos veículos que transportem cargas sólidas a granel (grãos, terra, areia, minério), devidamente tensionadas para evitar derramamento na rodovia.',
  },
  {
    id: 'contran-882',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 882/2021 (Pesos, Dimensões e Combinações de Carga - CVC)',
    legalScope: 'Resolução CONTRAN nº 882/2021 (Consolidou Res. 210, 211, 290, 520 e 803)',
    guideline: 'Limites de peso bruto total (PBT), peso por eixo e dimensões (largura 2,60m, altura 4,40m), tolerâncias legais na pesagem por balança rodoviária (5% PBT e 12,5% por eixo), inscrições obrigatórias (tara, lotação, CMT) e regras para CVC.',
  },
  {
    id: 'contran-960',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 960/2022 (Vidros de Segurança e Transmitância / Insulfilm)',
    legalScope: 'Resolução CONTRAN nº 960/2022 (Consolidou Res. 216, 253 e 254)',
    guideline: 'Transmitância luminosa mínima permitida: 70% para o para-brisa e vidros laterais dianteiros indispensáveis à dirigibilidade; proibição total de películas opacas ou refletivas/espelhadas; fiscalização por medidor de transmitância luminosa (luxímetro).',
  },
  {
    id: 'contran-968',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 968/2022 (Identificação Veicular e Gravação do Chassi / VIN)',
    legalScope: 'Resolução CONTRAN nº 968/2022 (Substituiu a Res. 24/1998)',
    guideline: 'Critérios para identificação veicular, gravação do número de identificação do veículo (VIN) no chassi ou monobloco, plaquetas destrutíveis na remoção e identificação em vidros.',
  },
  {
    id: 'contran-969',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 969/2022 (Placas de Identificação Veicular - Padrão Mercosul)',
    legalScope: 'Resolução CONTRAN nº 969/2022 (Substituiu a Res. 780/2019)',
    guideline: 'Padrão alfanumérico LLLNLNN com faixa azul, bandeira do Brasil e emblema do Mercosul, código bidimensional QR Code de rastreabilidade, critérios para instalação e substituição de placas.',
  },
  {
    id: 'contran-938',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 938/2022 (Cronotacógrafo / Registrador Inalterável de Velocidade)',
    legalScope: 'Resolução CONTRAN nº 938/2022 (Substituiu a Res. 92/1999)',
    guideline: 'Fiscalização do registrador instantâneo e inalterável de velocidade e tempo (cronotacógrafo): veículos obrigados (transporte escolar, passageiros > 10 lugares e carga > 4.536 kg), certificado de verificação do INMETRO e leitura do disco/fita diagrama.',
  },
  {
    id: 'contran-909',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 909/2022 (Fiscalização por Videomonitoramento Remoto)',
    legalScope: 'Resolução CONTRAN nº 909/2022 (Substituiu a Res. 471/2013)',
    guideline: 'Fiscalização de trânsito em rodovias mediante câmeras de videomonitoramento operadas remotamente por agente da autoridade. Exigência de sinalização prévia da rodovia e descrição obrigatória no campo de observações do AIT.',
  },
  {
    id: 'contran-798',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 798/2020 (Radares e Medidores de Velocidade)',
    legalScope: 'Resolução CONTRAN nº 798/2020',
    guideline: 'Tipos de medidores (fixo, estático, móvel e portátil). Requisitos de sinalização R-19, estudo técnico obrigatório e proibição categórica de radares escondidos/ocultos.',
  },
  {
    id: 'contran-810',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 810/2020 (Classificação de Danos em Sinistros de Trânsito)',
    legalScope: 'Resolução CONTRAN nº 810/2020',
    guideline: 'Relatório de Avarias preenchido pelo policial rodoviário federal: Pequena Monta (não bloqueia CRLV), Média Monta (bloqueia registro até aprovação em vistoria e CSV) e Grande Monta (veículo irrecuperável / sucata com baixa compulsória).',
  },
  {
    id: 'contran-819',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 819/2021 (Dispositivos de Retenção Infantil)',
    legalScope: 'Resolução CONTRAN nº 819/2021',
    guideline: 'Transporte de crianças de até 10 anos de idade: bebê conforto (até 1 ano), cadeirinha (1 a 4 anos), assento de elevação / booster (4 a 7 anos e meio ou que não tenham atingido 1,45m de altura) e cinto de segurança traseiro.',
  },
  {
    id: 'contran-906',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 906/2021 (Fiscalização do Descanso do Motorista Profissional)',
    legalScope: 'Resolução CONTRAN nº 906/2021',
    guideline: 'Fiscalização do tempo ininterrupto de direção e dos intervalos de descanso de motoristas profissionais de carga e passageiros por meio de cronotacógrafo ou controle eletrônico.',
  },
  {
    id: 'contran-911',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 911/2022 (Diretrizes do Exame Toxicológico de Larga Janela)',
    legalScope: 'Resolução CONTRAN nº 911/2022',
    guideline: 'Exame de queratina com janela de detecção mínima de 90 dias para drogas psicoativas. Cadastramento obrigatório do resultado no RENACH, sigilo médico e direito a contraprova.',
  },
  {
    id: 'contran-918',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 918/2022 (Procedimento de Notificação, Multas e SNE)',
    legalScope: 'Resolução CONTRAN nº 918/2022',
    guideline: 'Procedimentos de autuação, expedição de notificações da autuação e da penalidade, e pagamento de multa com 40% de desconto pelo Sistema de Notificação Eletrônica (SNE) mediante renúncia ao recurso.',
  },
  {
    id: 'contran-967',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 967/2022 (Transporte Rodoviário de Produtos Perigosos)',
    legalScope: 'Resolução CONTRAN nº 967/2022',
    guideline: 'Painel de segurança retangular laranja (com número de risco e número ONU) e rótulo de risco losangular com símbolo da classe. Porte do certificado de curso MOPP, kit de emergência e extintor específico.',
  },
  {
    id: 'contran-985',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 985/2022 (Manual Brasileiro de Fiscalização de Trânsito - MBFT)',
    legalScope: 'Resolução CONTRAN nº 985/2022 (MBFT)',
    guideline: 'Manual Brasileiro de Fiscalização de Trânsito: regras de autuação sem abordagem (quando possível e visível), preenchimento de observações obrigatórias, infrações concorrentes e sucessivas.',
  },
  {
    id: 'contran-996',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 996/2023 (Ciclomotores, Autopropelidos e Bicicletas Elétricas)',
    legalScope: 'Resolução CONTRAN nº 996/2023',
    guideline: 'Diferença técnica: Ciclomotor (até 50cc ou 4kW, velocidade máxima até 50 km/h, exige registro, emplacamento, CNH A ou ACC e capacete) vs Bicicleta Elétrica (potência até 1.000W, até 32 km/h, pedalada assistida sem acelerador) vs Autopropelido (patinete, skate até 32 km/h).',
  },
];

export function getRandomPrfTopic(category?: QuestionCategory): PRFTopicMetadata {
  const pool = category ? PRF_TOPICS_CATALOG.filter(t => t.category === category) : PRF_TOPICS_CATALOG;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Função genérica de sorteio ponderado (Weighted Random Selection)
export function pickWeightedItem<T>(items: T[], weightFn: (item: T) => number): T {
  if (items.length === 0) throw new Error('Pool cannot be empty');
  const weights = items.map(weightFn);
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  if (totalWeight <= 0) return items[Math.floor(Math.random() * items.length)];
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    if (random < weights[i]) {
      return items[i];
    }
    random -= weights[i];
  }
  return items[items.length - 1];
}

// Ponderação estatística do CTB baseada nos 10 slides das provas Cebraspe/PRF (195 itens de CTB)
export function getCtbArticleWeight(artigo: ArtigoLeiSeca): number {
  const m = artigo.numero.match(/Art\.?\s*(\d+)/i);
  const n = m ? parseInt(m[1], 10) : 0;

  // 1. O que mais derruba: Art. 20 (Competência privativa da PRF - caiu em 5 das 7 provas da PRF)
  if (n === 20) return 25;

  // 2. Os Crimes que mais caem (Slide 5: Arts. 298, 302, 306, 311, 312)
  if ([298, 302, 306, 311, 312].includes(n)) return 16;
  // Crimes secundários de destaque (Slide 5: Arts. 303, 304, 308, 309, 310)
  if ([303, 304, 308, 309, 310].includes(n)) return 12;
  // Demais crimes de trânsito (Arts. 291 a 312-B)
  if (n >= 291 && n <= 312) return 8;

  // 3. O CTB que mais cai (Slide 3: 50 itens de Infrações + Penalidades e Medidas)
  // Penalidades e Medidas Administrativas (Arts. 256 a 279-A - "estude antes da infração")
  if (n >= 256 && n <= 279) return 12;
  // Infrações mais cobradas (Arts. 161 a 255)
  if (n >= 161 && n <= 255) return 8;

  // 4. Normas Gerais de Circulação e Conduta (Slide 3: 29 itens - Arts. 26 a 67)
  if (n >= 26 && n <= 67) return 8;

  // 5. O que mais derruba / Mudanças 2025/2026 (Slide 6 & 10: Arts. 123, 140, 143, 147, 148, 159)
  if ([123, 140, 143, 147, 148, 159].includes(n) || artigo.texto.includes('148-A')) return 12;

  // 6. Sinalização de Trânsito (Slide 3: 22 itens - Arts. 80 a 90)
  if (n >= 80 && n <= 90) return 6;

  // Artigos de apoio / disposições gerais
  return 1;
}

// Ponderação estatística do CONTRAN baseada nos 71 itens dos slides PRF
export function getContranArticleWeight(artigo: ArtigoLeiSecaCONTRAN): number {
  const r = artigo.numeroRes;

  // 1. Cargas, Peso, Dimensões e Amarração (Slide 7: 16 itens - Res. 882/2021, 945/2022, 946/2022)
  if (['882', '945', '946'].includes(r)) return 16;

  // 2. Registro, Documentos, CRV/CRLV e Placas (Slide 7: 15 itens - Res. 1027/2026, 968/2022, 969/2022)
  if (['1027', '968', '969'].includes(r)) return 15;

  // 3. Novidades Normativas de Alto Impacto (Slide 1 & 9: Res. 1031/2026 Alcoolemia e Res. 1020/2025 Habilitação)
  if (['1031'].includes(r)) return 14;
  if (['1020'].includes(r)) return 10;

  // 4. Segurança do Veículo, Películas e Iluminação (Slide 7: 9 itens - Res. 960/2022, 970/2022, 993/2023)
  if (['960', '970', '993'].includes(r)) return 9;

  // 5. Fiscalização Eletrônica e Radares (Slide 7: 6 itens - Res. 798/2020, 909/2022)
  if (['798', '909'].includes(r)) return 7;

  // 6. Motorista Profissional e Tacógrafo (Slide 7: 6 itens - Res. 938/2022, 918/2022)
  if (['938', '918'].includes(r)) return 7;

  // Demais resoluções vigentes (Res. 810, 819, 911, 967, 985, 996)
  return 2;
}

export function getRandomCtbArticle(preferredTopicOrCapitulo?: string): ArtigoLeiSeca {
  const validPool = LEI_SECA_CTB.filter(a => {
    if (!a.texto || a.texto.length < 30) return false;
    if (/vetado/i.test(a.texto)) return false;
    if (/^\(?\s*revogad[oa]/i.test(a.texto.replace(/^Art\.?\s*\d+[º°o]?(?:-[A-Za-z])?\.?\s*/i, '').trim())) return false;
    return true;
  });

  const poolToUse = validPool.length > 0 ? validPool : LEI_SECA_CTB;

  if (preferredTopicOrCapitulo) {
    const norm = preferredTopicOrCapitulo.toLowerCase();
    const matching = poolToUse.filter(a => a.capitulo.toLowerCase().includes(norm));
    if (matching.length > 0) {
      return pickWeightedItem(matching, getCtbArticleWeight);
    }
  }
  return pickWeightedItem(poolToUse, getCtbArticleWeight);
}

export function getRandomContranArticle(preferredResNumberOrTopic?: string): ArtigoLeiSecaCONTRAN {
  const validPool = LEI_SECA_CONTRAN.filter(a => {
    if (!a.texto || a.texto.length < 30) return false;
    if (/vetado/i.test(a.texto)) return false;
    if (/^\(?\s*revogad[oa]/i.test(a.texto.replace(/^Art\.?\s*\d+[º°o]?(?:-[A-Za-z])?\.?\s*/i, '').trim())) return false;
    if (/^Art\.?\s*\d+[º°o]?\.?\s*Ficam?\s+revogad/i.test(a.texto)) return false;
    return true;
  });

  const poolToUse = validPool.length > 0 ? validPool : LEI_SECA_CONTRAN;

  if (preferredResNumberOrTopic) {
    const norm = preferredResNumberOrTopic.toLowerCase();
    const matching = poolToUse.filter(a =>
      a.resolucao.toLowerCase().includes(norm) ||
      a.numeroRes.toLowerCase().includes(norm) ||
      a.assunto.toLowerCase().includes(norm)
    );
    if (matching.length > 0) {
      return pickWeightedItem(matching, getContranArticleWeight);
    }
  }
  return pickWeightedItem(poolToUse, getContranArticleWeight);
}

const INVERSION_PAIRS: [RegExp, string][] = [
  [/\bobrigat[oó]ri[oa]\b/gi, 'facultativo(a)'],
  [/\bfacultativ[oa]\b/gi, 'obrigatório(a)'],
  [/\bvedado\b/gi, 'permitido'],
  [/\bproibido\b/gi, 'autorizado'],
  [/\bpermitido\b/gi, 'terminantemente vedado'],
  [/\bautorizado\b/gi, 'expressamente proibido'],
  [/\bindepende\b/gi, 'depende obrigatoriamente'],
  [/\bdever[áa]\b/gi, 'poderá, a seu livre critério,'],
  [/\bdevem\b/gi, 'não precisam'],
  [/\bdeve\b/gi, 'não necessita'],
  [/\bsempre\b/gi, 'em nenhuma hipótese'],
  [/\bobjetivamente\b/gi, 'subjetivamente'],
  [/\bgrav[ií]ssima\b/gi, 'grave'],
  [/\bgrave\b/gi, 'média'],
  [/\bm[eé]dia\b/gi, 'leve'],
  [/\bcrime\b/gi, 'mera infração administrativa'],
  [/\bsuspens[aã]o\b/gi, 'mera advertência por escrito'],
  [/\b30 \(trinta\) dias\b/gi, '15 (quinze) dias'],
  [/\b10 \(dez\) anos\b/gi, '5 (cinco) anos'],
  [/\bexclusivamente\b/gi, 'facultativamente'],
  [/\bsomente\b/gi, 'mesmo que não'],
  [/\bprivativa\b/gi, 'concorrente'],
  [/\bdispensad[oa]\b/gi, 'obrigatório(a)'],
  [/\bexigid[oa]\b/gi, 'dispensado(a)'],
  [/\baplica-se\b/gi, 'não se aplica'],
  [/\bnão se aplica\b/gi, 'aplica-se irrestritamente'],
  [/\binexistirem\b/gi, 'ainda que existam'],
  [/\bmínim[oa]\b/gi, 'máximo(a)'],
  [/\bmáxim[oa]\b/gi, 'mínimo(a)'],
  [/\bexigência\b/gi, 'dispensa'],
  [/\bretém\b/gi, 'libera de imediato'],
  [/\bretenção\b/gi, 'imediata liberação'],
  [/\bremoção\b/gi, 'mera liberação após autuação'],
  [/\bapreensão\b/gi, 'devolução imediata'],
  [/\binadmissível\b/gi, 'plenamente admitido(a)'],
];

const INTRO_LIST_REGEX = /(?:seguintes\s+(?:etapas|requisitos|preceitos|diretrizes|critérios|órgãos|documentos|condições|hipóteses|casos)|são\s+(?:requisitos|competências|etapas|diretrizes|infrações)|observar[áa]o?\s+(?:o\s+seguinte|as\s+seguintes)|caber[áa]\s+ao\s+seguinte)/i;

interface ValidNormativeBlock {
  clean: string;
  isInciso: boolean;
  raw: string;
}

function getValidBlocksForArticle(rawText: string, isContran: boolean): ValidNormativeBlock[] {
  const rawBlocks = (rawText || '').split(/\n\n+/).map(b => b.trim());
  const valid: ValidNormativeBlock[] = [];

  for (const b of rawBlocks) {
    if (b.length < 25) continue;
    // Ignora cabeçalhos vazios introdutórios que apenas anunciam listas de incisos
    if (INTRO_LIST_REGEX.test(b) && b.endsWith(':')) continue;
    if (/^(?:CAPÍTULO|Seção|DO[S]?\s|DA[S]?\s|TÍTULO)/i.test(b)) continue;
    if (/vetado|\(Revogad[oa]|^Fica[m]?\s+revogad[oa]/i.test(b)) continue;
    if (/Imprensa Nacional|in\.gov\.br/i.test(b)) continue;

    const isInciso = /^[IVXLCDM]+\s*[\-–—\.]/i.test(b) || /^[a-z]\)\s*/i.test(b);

    let clean = b
      .replace(/^Art\.?\s*\d+[º°o]?(?:-[A-Za-z])?\.?\s*/i, '')
      .replace(/^§\s*\d+[º°o]?\.?\s*/i, '')
      .replace(/^[IVXLCDM]+\s*[\-–—\.]\s*/i, '')
      .replace(/^[a-z]\)\s*/i, '')
      .replace(/^Parágrafo\s+único\.?\s*/i, '')
      .replace(/\(Redação dada[^\)]*\)/gi, '')
      .replace(/\(Incluído[^\)]*\)/gi, '')
      .replace(/\(Vigência[^\)]*\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Transforma blocos de penas e penalidades de trânsito em orações completas
    clean = clean
      .replace(/^Penas?\s*[-–—]\s*/i, 'a conduta é cominada com pena de ')
      .replace(/^Infraç[ãa]o\s*[-–—]\s*/i, 'a infração cominada é de natureza ')
      .replace(/^Penalidade\s*[-–—]\s*/i, 'a penalidade aplicável é de ')
      .replace(/^Medida\s+administrativa\s*[-–—]\s*/i, 'a medida administrativa cabível é de ')
      .replace(/[;,:\s]+(?:ou|e)?\s*$/i, '')
      .replace(/\.$/, '')
      .trim();

    if (clean.length < 25 || clean.endsWith(':') || clean.endsWith('...')) continue;
    if (/vetado|\(Revogad[oa]|^Fica[m]?\s+revogad[oa]/i.test(clean)) continue;

    const maxSnippetLen = isContran ? 210 : 220;
    if (clean.length > maxSnippetLen) {
      // Divisão segura de orações respeitando abreviações jurídicas (art., arts., nº, inc., etc.)
      const parts = clean.split(/(?<!\b(?:art|arts|n|inc|fls|par|ex|p))\.\s+(?=[A-Z0-9])/i);
      if (parts.length > 1 && parts[0].length >= 30 && parts[0].length <= maxSnippetLen) {
        clean = parts[0].replace(/\.$/, '').trim();
      } else {
        // Se a oração inteira não cabe sem corte, descarta o bloco para nunca truncar
        continue;
      }
    }

    valid.push({ clean, isInciso, raw: b });
  }

  return valid;
}

export function generateProceduralQuestionFromCtbArticle(
  artigo: ArtigoLeiSeca,
  forceAnswer?: boolean,
  recursionDepth: number = 0
): ActiveRoundQuestion {
  const validBlocks = getValidBlocksForArticle(artigo.texto || '', false);

  if (validBlocks.length === 0 || recursionDepth > 6) {
    const fallbackArt = getRandomCtbArticle();
    if (recursionDepth > 6) {
      return {
        id: `ctb-safe-${Date.now()}`,
        uniqueHash: `ctb-safe-${Date.now()}`,
        category: 'CTB',
        topic: fallbackArt.capitulo,
        legalBasis: fallbackArt.dispositivo,
        statement: 'Nos termos do CTB, o trânsito de qualquer natureza nas vias terrestres do território nacional rege-se por este Código.',
        answer: true,
        explanation: 'CERTO. Disposição fundamental do Art. 1º do CTB.',
        wasAiRewritten: false,
      };
    }
    return generateProceduralQuestionFromCtbArticle(fallbackArt, forceAnswer, recursionDepth + 1);
  }

  const chosen = validBlocks[Math.floor(Math.random() * validBlocks.length)];
  let snippet = chosen.clean;

  // Ajusta a primeira letra para minúscula se não for sigla (ex.: CONTRAN, PRF)
  if (!/^[A-Z]{2,}/.test(snippet)) {
    snippet = snippet.charAt(0).toLowerCase() + snippet.slice(1);
  }

  const willBeCorrect = forceAnswer !== undefined ? forceAnswer : Math.random() >= 0.5;
  const prefix = `Nos termos do ${artigo.numero} do CTB, `;

  let statement = '';
  let answer = true;
  let explanation = '';

  if (willBeCorrect) {
    answer = true;
    if (chosen.isInciso) {
      statement = `${prefix}constitui preceito ou competência prevista ${snippet}.`;
    } else {
      statement = `${prefix}${snippet}.`;
    }
    explanation = `CERTO. Conforme o ${artigo.dispositivo}: "${chosen.clean}."`;
  } else {
    answer = false;
    let modified = snippet;
    let inverted = false;

    for (const [regex, replacement] of INVERSION_PAIRS) {
      if (regex.test(modified)) {
        modified = modified.replace(regex, replacement);
        inverted = true;
        break;
      }
    }

    if (!inverted) {
      if (chosen.isInciso) {
        statement = `${prefix}é expressamente vedado ou dispensado ${snippet}.`;
      } else {
        statement = `${prefix}não se aplica a regra de que ${snippet}.`;
      }
    } else {
      if (chosen.isInciso) {
        statement = `${prefix}constitui preceito ou competência prevista ${modified}.`;
      } else {
        statement = `${prefix}${modified}.`;
      }
    }
    explanation = `ERRADO. O dispositivo original do ${artigo.dispositivo} estabelece que: "${chosen.clean}."`;
  }

  // Se por qualquer variação ultrapassar 275 caracteres, tenta outro bloco de forma limpa sem cortar com "..."
  if (statement.length > 275) {
    return generateProceduralQuestionFromCtbArticle(getRandomCtbArticle(), forceAnswer, recursionDepth + 1);
  }

  return {
    id: `${artigo.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    uniqueHash: `${artigo.id}-${Date.now()}`,
    category: 'CTB',
    topic: artigo.capitulo,
    legalBasis: artigo.dispositivo,
    statement,
    answer,
    explanation,
    wasAiRewritten: false,
    articleText: chosen.raw,
  };
}

export function generateProceduralQuestionFromContranTopic(
  topicMeta: PRFTopicMetadata
): ActiveRoundQuestion {
  const isCorrect = Math.random() >= 0.5;
  let statement = '';
  let explanation = '';

  let guide = (topicMeta.guideline || '').trim().replace(/\.$/, '');
  if (guide.length > 210) {
    const parts = guide.split(/(?<!\b(?:art|arts|n|inc|fls|par|ex|p))\.\s+(?=[A-Z0-9])/i);
    if (parts.length > 1 && parts[0].length >= 30 && parts[0].length <= 210) {
      guide = parts[0].replace(/\.$/, '').trim();
    }
  }

  if (isCorrect) {
    statement = `Nos termos da ${topicMeta.legalScope}, ${guide}.`;
    explanation = `CERTO. Conforme a ${topicMeta.legalScope}: ${guide}.`;
  } else {
    let modified = guide;
    let inverted = false;

    for (const [regex, replacement] of INVERSION_PAIRS) {
      if (regex.test(modified)) {
        modified = modified.replace(regex, replacement);
        inverted = true;
        break;
      }
    }

    if (!inverted) {
      if (modified.includes('100% digital')) {
        modified = modified.replace('100% digital', 'exclusivamente em formato físico impresso');
      } else if (modified.includes('proibição')) {
        modified = modified.replace(/proibição/gi, 'permissão irrestrita');
      } else {
        modified = `é dispensada na fiscalização a exigência de que ${modified.toLowerCase()}`;
      }
    }

    statement = `Nos termos da ${topicMeta.legalScope}, ${modified}.`;
    explanation = `ERRADO. Na verdade, a ${topicMeta.legalScope} preconiza expressamente que: "${guide}."`;
  }

  return {
    id: `${topicMeta.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    uniqueHash: `${topicMeta.id}-${Date.now()}`,
    category: 'CONTRAN',
    topic: topicMeta.name,
    legalBasis: topicMeta.legalScope,
    statement,
    answer: isCorrect,
    explanation,
    wasAiRewritten: false,
  };
}

export function generateProceduralQuestionFromContranArticle(
  artigo: ArtigoLeiSecaCONTRAN,
  forceAnswer?: boolean,
  recursionDepth: number = 0
): ActiveRoundQuestion {
  const validBlocks = getValidBlocksForArticle(artigo.texto || '', true);

  if (validBlocks.length === 0 || recursionDepth > 6) {
    const fallbackArt = getRandomContranArticle();
    if (recursionDepth > 6) {
      return {
        id: `contran-safe-${Date.now()}`,
        uniqueHash: `contran-safe-${Date.now()}`,
        category: 'CONTRAN',
        topic: fallbackArt.resolucao,
        legalBasis: fallbackArt.dispositivo,
        statement: `Nos termos da ${fallbackArt.resolucao}, a fiscalização de trânsito deve observar as diretrizes regulamentares expedidas pelo CONTRAN.`,
        answer: true,
        explanation: `CERTO. Fundamentação regulamentar com base no ${fallbackArt.dispositivo}.`,
        wasAiRewritten: false,
      };
    }
    return generateProceduralQuestionFromContranArticle(fallbackArt, forceAnswer, recursionDepth + 1);
  }

  const chosen = validBlocks[Math.floor(Math.random() * validBlocks.length)];
  let snippet = chosen.clean;

  // Ajusta a primeira letra para minúscula se não for sigla (ex.: CONTRAN, PRF, RENAVAM)
  if (!/^[A-Z]{2,}/.test(snippet)) {
    snippet = snippet.charAt(0).toLowerCase() + snippet.slice(1);
  }

  const willBeCorrect = forceAnswer !== undefined ? forceAnswer : Math.random() >= 0.5;
  const prefix = `Conforme o ${artigo.dispositivo}, `;

  let statement = '';
  let answer = true;
  let explanation = '';

  if (willBeCorrect) {
    answer = true;
    if (chosen.isInciso) {
      statement = `${prefix}constitui preceito ou etapa legal que ${snippet}.`;
    } else {
      statement = `${prefix}${snippet}.`;
    }
    explanation = `CERTO. Conforme o ${artigo.dispositivo}: "${chosen.clean}."`;
  } else {
    answer = false;
    let modified = snippet;
    let inverted = false;

    for (const [regex, replacement] of INVERSION_PAIRS) {
      if (regex.test(modified)) {
        modified = modified.replace(regex, replacement);
        inverted = true;
        break;
      }
    }

    if (!inverted) {
      if (chosen.isInciso) {
        statement = `${prefix}é expressamente dispensada a exigência de que ${snippet}.`;
      } else {
        statement = `${prefix}não se aplica a regra de que ${snippet}.`;
      }
    } else {
      if (chosen.isInciso) {
        statement = `${prefix}constitui preceito ou etapa legal que ${modified}.`;
      } else {
        statement = `${prefix}${modified}.`;
      }
    }
    explanation = `ERRADO. O dispositivo original do ${artigo.dispositivo} estabelece que: "${chosen.clean}."`;
  }

  // Se por qualquer variação ultrapassar 275 caracteres, tenta outro bloco de forma limpa sem cortar com "..."
  if (statement.length > 275) {
    return generateProceduralQuestionFromContranArticle(getRandomContranArticle(), forceAnswer, recursionDepth + 1);
  }

  return {
    id: `${artigo.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    uniqueHash: `${artigo.id}-${Date.now()}`,
    category: 'CONTRAN',
    topic: artigo.resolucao,
    legalBasis: artigo.dispositivo,
    statement,
    answer,
    explanation,
    wasAiRewritten: false,
    articleText: chosen.raw,
  };
}
