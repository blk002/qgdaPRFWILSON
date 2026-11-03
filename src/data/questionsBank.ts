import LEI_SECA_CTB_RAW from './leiSecaCTB.json';

export type QuestionCategory = 'CTB' | 'CONTRAN';

export interface ArtigoLeiSeca {
  id: string;
  numero: string;
  capitulo: string;
  dispositivo: string;
  texto: string;
}

export const LEI_SECA_CTB: ArtigoLeiSeca[] = LEI_SECA_CTB_RAW as ArtigoLeiSeca[];

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
    name: 'CTB - Sistema Nacional de Trânsito e Competências da PRF',
    legalScope: 'Arts. 1º a 25 do CTB',
    guideline: 'Composição do SNT, competências privativas da PRF em rodovias federais (fiscalização, lavratura de TCO, perícia de trânsito), CONTRAN, CETRAN e órgãos rodoviários.',
  },
  {
    id: 'ctb-circulacao-regras',
    category: 'CTB',
    name: 'CTB - Normas Gerais de Circulação e Conduta',
    legalScope: 'Arts. 26 a 67 do CTB',
    guideline: 'Preferência de passagem em cruzamentos e rotatórias, circulação pela direita, ultrapassagens, distância de segurança, uso de luzes e faróis diurnos em pista simples.',
  },
  {
    id: 'ctb-motorista-prof',
    category: 'CTB',
    name: 'CTB - Condução por Motoristas Profissionais',
    legalScope: 'Arts. 67-A a 67-E do CTB',
    guideline: 'Tempo máximo ininterrupto de direção (transporte de passageiros e carga), intervalo obrigatório de descanso (11h diárias, 30 min a cada 4h/5h30) e registro em tacógrafo.',
  },
  {
    id: 'ctb-pedestres-ciclistas',
    category: 'CTB',
    name: 'CTB - Pedestres e Veículos Não Motorizados',
    legalScope: 'Arts. 68 a 71 do CTB',
    guideline: 'Prioridade do pedestre na faixa, travessia em rodovias, circulação de ciclistas e distância lateral mínima de 1,5m para ultrapassagem.',
  },
  {
    id: 'ctb-sinalizacao',
    category: 'CTB',
    name: 'CTB - Sinalização de Trânsito e Engenharia Viária',
    legalScope: 'Arts. 80 a 95 do CTB',
    guideline: 'Ordem de prevalência das normas (ordens do agente de trânsito prevalecem sobre semáforo e placas), sinalização vertical e horizontal.',
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
    name: 'CTB - Registro e Licenciamento de Veículos (CRV e CRLV)',
    legalScope: 'Arts. 118 a 135 do CTB',
    guideline: 'Emissão de novo CRV (transferência em 30 dias), porte do CRLV (físico ou digital), baixa de veículos irrecuperáveis e clonados.',
  },
  {
    id: 'ctb-habilitacao-cnh',
    category: 'CTB',
    name: 'CTB - Habilitação, Categorias e Validade da CNH',
    legalScope: 'Arts. 140 a 160 do CTB',
    guideline: 'Categorias A, B, C, D e E. Validade do exame médico (10 anos <50, 5 anos 50-69, 3 anos 70+), exigências de idade e experiência para categorias D e E.',
  },
  {
    id: 'ctb-toxicologico',
    category: 'CTB',
    name: 'CTB - Exame Toxicológico Periódico',
    legalScope: 'Arts. 148-A e 165-B do CTB (Lei 14.599/2023)',
    guideline: 'Periodicidade de 2 anos e 6 meses para condutores C, D e E com menos de 70 anos. Infração gravíssima por dirigir após 30 dias do vencimento.',
  },
  {
    id: 'ctb-infracoes-alcool',
    category: 'CTB',
    name: 'CTB - Infrações: Alcoolemia e Recusa ao Teste',
    legalScope: 'Arts. 165 e 165-A do CTB',
    guideline: 'Dirigir sob efeito de álcool ou substância psicoativa. Recusa a bafômetro/etilômetro. Multa gravíssima (10x), suspensão de 12 meses e retenção do veículo.',
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
    name: 'CTB - Infrações: Celular, Cinto e Capacete',
    legalScope: 'Arts. 167, 244 e 252 do CTB',
    guideline: 'Segurar ou manusear celular ao volante (infração gravíssima). Não usar cinto (grave). Conduzir moto transportando criança menor de 10 anos (gravíssima).',
  },
  {
    id: 'ctb-penalidades',
    category: 'CTB',
    name: 'CTB - Penalidades, Pontuação e Suspensão da CNH',
    legalScope: 'Arts. 256 a 268 do CTB',
    guideline: 'Escalonamento de pontuação para suspensão da CNH (20, 30 ou 40 pontos conforme gravíssimas). Regra fixa de 40 pontos para condutor com EAR. Advertência por escrito.',
  },
  {
    id: 'ctb-medidas-adm',
    category: 'CTB',
    name: 'CTB - Medidas Administrativas: Retenção e Remoção',
    legalScope: 'Arts. 269 a 279-A do CTB',
    guideline: 'Diferença entre penalidade e medida administrativa. Retenção do veículo, remoção para pátio, saneamento no local e recolhimento de documentos.',
  },
  {
    id: 'ctb-processo-adm',
    category: 'CTB',
    name: 'CTB - Processo Administrativo e Recursos no SNT',
    legalScope: 'Arts. 280 a 290 do CTB',
    guideline: 'Auto de infração de trânsito (AIT), prazo de expedição da notificação da autuação (30 dias sob pena de arquivamento), defesa prévia, JARI e CETRAN.',
  },
  {
    id: 'ctb-crimes-geral',
    category: 'CTB',
    name: 'CTB - Crimes de Trânsito: Parte Geral',
    legalScope: 'Arts. 291 a 301 do CTB',
    guideline: 'Aplicação subsidiária do Código Penal e Lei 9.099/95. Circunstâncias agravantes (faixa de pedestres, sem CNH). Vedação de prisão em flagrante se prestar socorro.',
  },
  {
    id: 'ctb-crimes-homicidio',
    category: 'CTB',
    name: 'CTB - Crimes: Homicídio e Lesão Corporal Culposa',
    legalScope: 'Arts. 302 e 303 do CTB',
    guideline: 'Homicídio culposo na direção de veículo. Formas qualificadas por embriaguez ou drogas (reclusão de 5 a 8 anos). Vedação da substituição por penas restritivas de direitos.',
  },
  {
    id: 'ctb-crimes-alcool-fuga',
    category: 'CTB',
    name: 'CTB - Crimes: Embriaguez ao Volante e Fuga de Local',
    legalScope: 'Arts. 304, 305 e 306 do CTB',
    guideline: 'Art. 306: Crime de perigo abstrato. Limite do etilômetro (>= 0,30 mg/L ar alveolar ou >= 6 dg/L sangue). Art. 305 (fuga do local) e tipificação penal.',
  },
  {
    id: 'ctb-crimes-racha',
    category: 'CTB',
    name: 'CTB - Crimes: Racha, Velocidade e Violação de Suspensão',
    legalScope: 'Arts. 307 a 312-B do CTB',
    guideline: 'Art. 307 (violar suspensão). Art. 308 (racha / disputa não autorizada) qualificado por morte ou lesão grave. Art. 309 (dirigir sem CNH gerando perigo concreto de dano).',
  },

  // ================= CONTRAN =================
  {
    id: 'contran-268',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 268/2008 (Iluminação Intermitente e Alarme)',
    legalScope: 'Resolução CONTRAN nº 268/2008',
    guideline: 'Uso de luzes vermelhas e sirenes para socorro e polícia, luz âmbar intermitente para serviços de utilidade pública e socorro mecânico, prioridade no trânsito.',
  },
  {
    id: 'contran-432',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 432/2013 (Fiscalização de Alcoolemia)',
    legalScope: 'Resolução CONTRAN nº 432/2013',
    guideline: 'Medição pelo etilômetro: valor considerado e erro máximo admissível. Constatação por sinais clínicos de alteração psicomotora (Anexo II).',
  },
  {
    id: 'contran-789',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 789/2020 (Habilitação e Exames)',
    legalScope: 'Resolução CONTRAN nº 789/2020',
    guideline: 'Procedimentos de formação de condutores, exames teórico e prático, faltas eliminatórias, graves (3 pts), médias (2 pts) e leves (1 pt). Limite de 3 pontos para aprovação.',
  },
  {
    id: 'contran-798',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 798/2020 (Radares e Medidores de Velocidade)',
    legalScope: 'Resolução CONTRAN nº 798/2020',
    guideline: 'Tipos de medidores (fixo, estático, móvel e portátil). Requisitos de sinalização R-19, estudo técnico obrigatório e proibição de radares escondidos/ocultos.',
  },
  {
    id: 'contran-810',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 810/2020 (Classificação de Danos em Sinistros)',
    legalScope: 'Resolução CONTRAN nº 810/2020',
    guideline: 'Relatório de Avarias preenchido pela PRF: Pequena Monta (não bloqueia CRLV), Média Monta (bloqueia até vistoria CSV) e Grande Monta (irrecuperável/sucata).',
  },
  {
    id: 'contran-819',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 819/2021 (Dispositivos de Retenção Infantil)',
    legalScope: 'Resolução CONTRAN nº 819/2021',
    guideline: 'Transporte de crianças até 10 anos: bebê conforto, cadeirinha, assento de elevação (booster) e dispensa de booster ao atingir 1,45m de altura.',
  },
  {
    id: 'contran-882',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 882/2021 (Limites de Peso e Dimensões)',
    legalScope: 'Resolução CONTRAN nº 882/2021',
    guideline: 'Pesagem por balança rodoviária, tolerâncias (5% no PBT, 12,5% por eixo), limites de largura (2,60m), altura (4,40m) e comprimento para caminhões e ônibus.',
  },
  {
    id: 'contran-906',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 906/2021 (Fiscalização do Descanso do Motorista)',
    legalScope: 'Resolução CONTRAN nº 906/2021',
    guideline: 'Fiscalização do tempo de direção através de tacógrafo ou meio eletrônico. Exigência do descanso diário de 11h e pausas em rodovias.',
  },
  {
    id: 'contran-909',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 909/2022 (Videomonitoramento em Rodovias)',
    legalScope: 'Resolução CONTRAN nº 909/2022',
    guideline: 'Fiscalização de trânsito por câmeras de videomonitoramento operadas remotamente por agente da autoridade. Requisitos de sinalização prévia da rodovia e campo de observação no AIT.',
  },
  {
    id: 'contran-911',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 911/2022 (Exame Toxicológico de Larga Janela)',
    legalScope: 'Resolução CONTRAN nº 911/2022',
    guideline: 'Exame de queratina com janela de detecção mínima de 90 dias. Contraprova, sigilo médico e cadastramento obrigatório no RENACH.',
  },
  {
    id: 'contran-912',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 912/2022 (Extintores e Equipamentos Obrigatórios)',
    legalScope: 'Resolução CONTRAN nº 912/2022',
    guideline: 'Extintor de incêndio ABC: facultativo para automóveis e utilitários de passeio; obrigatório para caminhão, ônibus, micro-ônibus e transporte remunerado.',
  },
  {
    id: 'contran-918',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 918/2022 (Fiscalização e Procedimento de Multas)',
    legalScope: 'Resolução CONTRAN nº 918/2022',
    guideline: 'Procedimentos de autuação, prazos de envio de notificações, pagamento de multa com 40% de desconto pelo SNE (renúncia a recurso).',
  },
  {
    id: 'contran-922',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 922/2022 (Insulfilm e Transmitância Luminosa)',
    legalScope: 'Resolução CONTRAN nº 922/2022',
    guideline: 'Transmitância luminosa mínima: 70% para o para-brisa e vidros laterais dianteiros (indispensáveis à dirigibilidade); proibição total de películas espelhadas ou opacas.',
  },
  {
    id: 'contran-923',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 923/2022 (Fiscalização com Câmera Corporal e OCR)',
    legalScope: 'Resolução CONTRAN nº 923/2022',
    guideline: 'Uso de sistemas de leitura automática de placas (OCR) e equipamentos audiovisuais portáteis pelos policiais rodoviários federais.',
  },
  {
    id: 'contran-924',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 924/2022 (Transporte Escolar e Inspeção Semestral)',
    legalScope: 'Resolução CONTRAN nº 924/2022',
    guideline: 'Exigências para condutor escolar (idade mínima 21 anos, CNH D, curso especializado) e veículos escolares (faixa amarela, tacógrafo, inspeção semestral).',
  },
  {
    id: 'contran-965',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 965/2022 (Áreas de Estacionamento Específico)',
    legalScope: 'Resolução CONTRAN nº 965/2022',
    guideline: 'Regulamentação de vagas especiais para idosos, pessoas com deficiência (PCD), carga e descarga, ambulâncias e viaturas policiais.',
  },
  {
    id: 'contran-967',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 967/2022 (Transporte de Produtos Perigosos)',
    legalScope: 'Resolução CONTRAN nº 967/2022',
    guideline: 'Painel de segurança retangular laranja (com nº de risco e nº ONU) e rótulo de risco losangular. Porte do curso MOPP, kit de emergência e extintor específico.',
  },
  {
    id: 'contran-985',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 985/2022 (Manual de Fiscalização - MBFT)',
    legalScope: 'Resolução CONTRAN nº 985/2022 (MBFT)',
    guideline: 'Manual Brasileiro de Fiscalização de Trânsito: regras de autuação sem abordagem (quando possível e visível), preenchimento de observações, infrações concorrentes e sucessivas.',
  },
  {
    id: 'contran-996',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 996/2023 (Ciclomotores e Bikes Elétricas)',
    legalScope: 'Resolução CONTRAN nº 996/2023',
    guideline: 'Ciclomotor (até 50cc ou 4kW, max 50 km/h, exige ACC ou CNH A, placa e capacete) vs Bicicleta Elétrica (pedalada assistida, até 32 km/h, sem acelerador manual).',
  },
  {
    id: 'contran-1004',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 1004/2023 (Identificação Veicular e Placas Mercosul)',
    legalScope: 'Resolução CONTRAN nº 1004/2023',
    guideline: 'Padrão alfanumérico LLLNLNN (três letras, um número, uma letra e dois números), faixa azul com bandeira do Brasil e emblema do Mercosul, QR Code de segurança.',
  },
];

export function getRandomPrfTopic(category?: QuestionCategory): PRFTopicMetadata {
  const pool = category ? PRF_TOPICS_CATALOG.filter(t => t.category === category) : PRF_TOPICS_CATALOG;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomCtbArticle(preferredTopicOrCapitulo?: string): ArtigoLeiSeca {
  if (preferredTopicOrCapitulo) {
    const norm = preferredTopicOrCapitulo.toLowerCase();
    const matching = LEI_SECA_CTB.filter(a => a.capitulo.toLowerCase().includes(norm));
    if (matching.length > 0) {
      return matching[Math.floor(Math.random() * matching.length)];
    }
  }
  return LEI_SECA_CTB[Math.floor(Math.random() * LEI_SECA_CTB.length)];
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
  [/\bsempre\b/gi, 'em nenhuma hipótese'],
  [/\bobjetivamente\b/gi, 'subjetivamente'],
  [/\bgrav[ií]ssima\b/gi, 'grave'],
  [/\bgrave\b/gi, 'média'],
  [/\bm[eé]dia\b/gi, 'leve'],
  [/\bcrime\b/gi, 'mera infração administrativa'],
  [/\bsuspens[aã]o\b/gi, 'mera advertência por escrito'],
  [/\b30 \(trinta\) dias\b/gi, '15 (quinze) dias'],
  [/\b10 \(dez\) anos\b/gi, '5 (cinco) anos'],
];

const CEBRASPE_INTROS = [
  'A respeito da legislação de trânsito brasileira e das competências de fiscalização, julgue o item seguinte:',
  'Considerando as normas que regem o trânsito em vias terrestres nacionais, julgue a assertiva a seguir:',
  'No que concerne aos preceitos legais e regulamentares de trânsito, julgue o item subsecutivo:',
  'Com base na jurisprudência administrativa e nas disposições legais pertinentes, julgue o item:',
];

export function generateProceduralQuestionFromCtbArticle(
  artigo: ArtigoLeiSeca,
  forceAnswer?: boolean
): ActiveRoundQuestion {
  const paragraphs = artigo.texto
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 25 && !p.startsWith('(VETADO)') && !p.startsWith('CAPÍTULO') && !p.startsWith('Seção'));

  const chosenParagraph = paragraphs.length > 0
    ? paragraphs[Math.floor(Math.random() * paragraphs.length)]
    : artigo.texto;

  // Limpa prefixos de parágrafos como "Art. 29. ", "§ 1º ", "I - "
  const cleanSnippet = chosenParagraph
    .replace(/^Art\.?\s*\d+[º°]?(?:-[A-Za-z])?\.?\s*/i, '')
    .replace(/^§\s*\d+[º°]?\s*/i, '')
    .replace(/^[IVXLCDM]+\s*-\s*/i, '')
    .replace(/^Parágrafo\s+único\.?\s*/i, '')
    .trim();

  // Decide se será CERTO ou ERRADO
  const willBeCorrect = forceAnswer !== undefined ? forceAnswer : Math.random() >= 0.5;

  let statement = '';
  let answer = true;
  let explanation = '';

  if (willBeCorrect) {
    answer = true;
    statement = `Nos termos do ${artigo.numero} do CTB, ${cleanSnippet}`;
    if (statement.length > 275) {
      statement = statement.slice(0, 272).replace(/[,;:\s]+$/, '') + '...';
    }
    explanation = `CERTO. Conforme o ${artigo.dispositivo}: "${chosenParagraph.slice(0, 200)}..."`;
  } else {
    answer = false;
    let modified = cleanSnippet;
    let inverted = false;

    for (const [regex, replacement] of INVERSION_PAIRS) {
      if (regex.test(modified)) {
        modified = modified.replace(regex, replacement);
        inverted = true;
        break;
      }
    }

    if (!inverted) {
      modified = `é expressamente vedado que ${cleanSnippet.toLowerCase()}`;
    }

    statement = `Nos termos do ${artigo.numero} do CTB, ${modified}`;
    if (statement.length > 275) {
      statement = statement.slice(0, 272).replace(/[,;:\s]+$/, '') + '...';
    }
    explanation = `ERRADO. O dispositivo original do ${artigo.dispositivo} estabelece que: "${chosenParagraph.slice(0, 200)}..."`;
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
    articleText: chosenParagraph,
  };
}

export function generateProceduralQuestionFromContranTopic(
  topicMeta: PRFTopicMetadata
): ActiveRoundQuestion {
  const isCorrect = Math.random() >= 0.5;
  const intro = CEBRASPE_INTROS[Math.floor(Math.random() * CEBRASPE_INTROS.length)];
  let statement = '';
  let explanation = '';

  if (isCorrect) {
    statement = `Segundo a ${topicMeta.legalScope}, no exercício da fiscalização pela PRF, ${topicMeta.guideline.toLowerCase()}`;
    if (statement.length > 275) statement = statement.slice(0, 272) + '...';
    explanation = `CERTO. A assertiva reflete fielmente as diretrizes técnicas da ${topicMeta.legalScope}: ${topicMeta.guideline}`;
  } else {
    statement = `Em contradição ao estabelecido na ${topicMeta.legalScope}, é dispensada a observância das regras de ${topicMeta.name.toLowerCase()} nas rodovias federais.`;
    if (statement.length > 275) statement = statement.slice(0, 272) + '...';
    explanation = `ERRADO. A ${topicMeta.legalScope} impõe expressamente a aplicação de tais diretrizes: ${topicMeta.guideline}`;
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
