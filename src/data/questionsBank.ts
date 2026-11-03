export type QuestionCategory = 'CTB' | 'CONTRAN';

export interface PRFTopicMetadata {
  id: string;
  category: QuestionCategory;
  name: string;
  legalScope: string;
  guideline: string;
}

export interface BaseLegalQuestion {
  id: string;
  category: QuestionCategory;
  topic: string;
  legalBasis: string;
  answer: boolean; // true = CERTO, false = ERRADO
  explanation: string;
  coreStatements: string[]; // Diverse base phrasings of the same legal rule
}

export interface ActiveRoundQuestion {
  id: string;
  uniqueHash: string;
  category: QuestionCategory;
  topic: string;
  legalBasis: string;
  statement: string;
  answer: boolean;
  explanation: string;
  wasAiRewritten?: boolean;
}

// Catálogo Abrangente de Tópicos do Edital PRF (CTB + Todas as Resoluções CONTRAN)
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
    name: 'CONTRAN - Res. 912/2022 (Equipamentos Obrigatórios)',
    legalScope: 'Resolução CONTRAN nº 912/2022',
    guideline: 'Equipamentos obrigatórios por tipo de veículo: cinto, espelhos retrovisores, triângulo, macaco, chave de roda, buzina, velocímetro e pneu sobressalente (estepe).',
  },
  {
    id: 'contran-918',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 918/2022 (Autuação, Notificação e Multas)',
    legalScope: 'Resolução CONTRAN nº 918/2022',
    guideline: 'Procedimentos de notificação eletrônica (SNE com 40% de desconto), prazos de pagamento, parcelamento e competência recursal no âmbito do SNT.',
  },
  {
    id: 'contran-919',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 919/2022 (Extintor de Incêndio Veicular)',
    legalScope: 'Resolução CONTRAN nº 919/2022',
    guideline: 'Uso facultativo para automóveis e utilitários particulares. Permanece obrigatório para caminhões, tratores, ônibus, transporte coletivo e inflamáveis.',
  },
  {
    id: 'contran-925',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 925/2022 e 926/2022 (Amarração de Cargas e CVC)',
    legalScope: 'Resoluções CONTRAN nº 925/2022 e 926/2022',
    guideline: 'Proibição de cordas para fixação primária de carga (exigência de cintas, correntes ou cabos de aço). Requisitos para Combinações de Veículos de Carga (bitrem e rodotrem) e AET.',
  },
  {
    id: 'contran-955',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 955/2022 (Capacete Motociclístico e Viseira)',
    legalScope: 'Resolução CONTRAN nº 955/2022',
    guideline: 'Uso de capacete com selo do Inmetro e dispositivo retrorrefletivo. Posição da viseira abaixada ou óculos de proteção. Proibição de película ou viseira fumê à noite.',
  },
  {
    id: 'contran-960',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 960/2022 (Vidros e Películas / Insulfilm)',
    legalScope: 'Resolução CONTRAN nº 960/2022',
    guideline: 'Transmitância luminosa mínima: não inferior a 70% para para-brisa e vidros laterais dianteiros. Proibição de películas reflexivas ou espelhadas.',
  },
  {
    id: 'contran-965',
    category: 'CONTRAN',
    name: 'CONTRAN - Res. 965/2022 (Vagas de Estacionamento Específico)',
    legalScope: 'Resolução CONTRAN nº 965/2022',
    guideline: 'Credenciamento e credencial visível no painel para vagas de Idoso e Pessoa com Deficiência (PCD). Estacionar em vaga reservada sem credencial: infração gravíssima.',
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

export const QUESTIONS_BANK: BaseLegalQuestion[] = [
  // ==================== CTB ====================
  {
    id: 'ctb-01',
    category: 'CTB',
    topic: 'CTB - Normas Gerais de Circulação e Conduta',
    legalBasis: 'Art. 29, III, do CTB (Lei nº 9.503/1997)',
    answer: true,
    explanation:
      'CORRETO. Pelo Art. 29, III, do CTB, quando veículos transitando por fluxos que se cruzem aproximarem-se de local não sinalizado, a preferência pertencerá: a) no caso de apenas um fluxo ser de rodovia, àquele que estiver circulando por ela; b) em rotatória, àquele que estiver circulando por ela; c) nos demais casos, ao que vier pela direita do condutor.',
    coreStatements: [
      'Em interseções desprovidas de sinalização específica, caso apenas um dos fluxos que se cruzam seja oriundo de rodovia, a preferência de passagem pertencerá ao veículo que nela estiver trafegando.',
      'Quando dois veículos se aproximam de um cruzamento não sinalizado e somente um deles circula por rodovia, este detém a preferência legal de passagem sobre o demais.',
      'Na ausência de sinalização em um cruzamento viário, o condutor que trafega por uma rodovia tem prioridade de passagem em relação ao fluxo proveniente de via de outra natureza.',
    ],
  },
  {
    id: 'ctb-02',
    category: 'CTB',
    topic: 'CTB - Habilitação, Categorias e Validade da CNH',
    legalBasis: 'Art. 147, § 2º, do CTB (Lei nº 14.071/2020)',
    answer: false,
    explanation:
      'ERRADO. Conforme o Art. 147, § 2º, do CTB, o exame de aptidão física e mental deve ser renovado a cada 10 anos para condutores com idade inferior a 50 anos; a cada 5 anos para condutores com idade igual ou superior a 50 e inferior a 70 anos; e a cada 3 anos para condutores com idade igual ou superior a 70 anos.',
    coreStatements: [
      'O prazo de renovação do exame de aptidão física e mental para motoristas com idade entre 50 e 69 anos completos é de dez anos, reduzindo-se para cinco anos apenas após os 70 anos.',
      'Condutores que possuem 55 anos de idade fazem jus à renovação decenal (a cada 10 anos) do exame de aptidão física e mental exigido para a CNH.',
      'Pelas regras vigentes de validade da CNH, a periodicidade de cinco anos para renovação do exame médico aplica-se exclusivamente aos condutores com idade igual ou superior a 70 anos.',
    ],
  },
  {
    id: 'ctb-03',
    category: 'CTB',
    topic: 'CTB - Penalidades, Pontuação e Suspensão da CNH',
    legalBasis: 'Art. 261, § 1º e § 5º, do CTB',
    answer: true,
    explanation:
      'CORRETO. Nos termos do Art. 261, I, do CTB, a suspensão por pontos ocorre com 20 pts (2+ gravíssimas), 30 pts (1 gravíssima) ou 40 pts (nenhuma gravíssima). Para o motorista que exerce atividade remunerada (EAR), o teto é sempre fixo em 40 pontos, independentemente da gravidade das infrações.',
    coreStatements: [
      'O motorista que não exerce atividade remunerada ao veículo terá instaurado processo de suspensão do direito de dirigir ao atingir 30 pontos em 12 meses, caso haja exatamente uma infração de natureza gravíssima em seu prontuário nesse período.',
      'Na contagem de pontos em doze meses para condutor sem EAR na CNH, a existência de uma única infração gravíssima fixa o teto para suspensão do direito de dirigir em trinta pontos.',
      'Para o condutor que exerce atividade remunerada (EAR), o limite para suspensão do direito de dirigir por pontuação é sempre fixado em 40 pontos, independentemente da quantidade de infrações gravíssimas.',
    ],
  },
  {
    id: 'ctb-04',
    category: 'CTB',
    topic: 'CTB - Crimes: Embriaguez ao Volante e Fuga de Local',
    legalBasis: 'Art. 306 do CTB',
    answer: false,
    explanation:
      'ERRADO. O crime de embriaguez ao volante (Art. 306 do CTB) exige concentração igual ou superior a 6 decigramas de álcool por litro de sangue OU igual ou superior a 0,3 miligrama de álcool por litro de ar alveolar. Medições de 0,15 mg/L configuram apenas infração administrativa (Art. 165), salvo alteração psicomotora notória.',
    coreStatements: [
      'A simples constatação, por etilômetro, de concentração de 0,15 miligrama de álcool por litro de ar alveolar, sem outros sinais de alteração psicomotora, é suficiente para tipificar o crime de embriaguez ao volante previsto no Art. 306 do CTB.',
      'Configura crime de trânsito, independentemente de outros sintomas clínicos, o resultado de teste de alcoolemia que aponte exatamente 0,18 mg de álcool por litro de ar alveolar expelido pelos pulmões.',
      'Para o enquadramento criminal no delito de conduzir veículo sob influência de álcool pelo critério exclusivamente quantitativo do etilômetro, basta atingir a marca de 0,20 mg/L de ar alveolar.',
    ],
  },
  {
    id: 'ctb-05',
    category: 'CTB',
    topic: 'CTB - Normas Gerais de Circulação e Conduta',
    legalBasis: 'Art. 40, I e § 2º, do CTB',
    answer: true,
    explanation:
      'CORRETO. De acordo com o Art. 40, I e § 2º, do CTB, os veículos que não dispuserem de luzes de rodagem diurna (DRL) deverão manter acesos os faróis nas rodovias de pista simples situadas fora dos perímetros urbanos, mesmo durante o dia.',
    coreStatements: [
      'Veículos desprovidos de luzes de rodagem diurna (DRL) estão obrigados a manter o farol baixo aceso durante o dia quando circularem por rodovias de pista simples localizadas fora do perímetro urbano.',
      'Em rodovias de pista simples fora da área urbana, exige-se o acionamento diurno dos faróis de luz baixa para os automóveis que não contem com farol de rodagem diurna (DRL).',
      'Durante o período diurno, a obrigatoriedade de manter os faróis baixos acesos em rodovias aplica-se aos veículos sem tecnologia DRL que trafeguem em trechos de pista simples fora dos perímetros urbanos.',
    ],
  },
  {
    id: 'ctb-06',
    category: 'CTB',
    topic: 'CTB - Infrações: Celular, Cinto e Capacete',
    legalBasis: 'Art. 244, V, do CTB (Lei nº 14.071/2020)',
    answer: false,
    explanation:
      'ERRADO. A Lei nº 14.071/2020 alterou o Art. 244, V, do CTB: constitui infração gravíssima (com suspensão do direito de dirigir) conduzir motocicleta transportando criança menor de 10 (dez) anos de idade ou que não tenha condições de cuidar de sua segurança (a regra antiga de 7 anos foi revogada).',
    coreStatements: [
      'É permitido pelo Código de Trânsito Brasileiro o transporte de criança de oito anos de idade em motocicleta, desde que ela utilize capacete certificado e alcance os pedais de apoio.',
      'A idade mínima legal para que uma criança possa ser transportada como passageira em motoneta ou motocicleta é de sete anos completos, conforme a redação atual do Art. 244 do CTB.',
      'Conduzir motocicleta transportando passageiro de nove anos de idade não configura infração de trânsito, contanto que a criança tenha porte físico para firmar-se no veículo.',
    ],
  },
  {
    id: 'ctb-07',
    category: 'CTB',
    topic: 'CTB - Exame Toxicológico Periódico',
    legalBasis: 'Art. 148-A e Art. 165-B do CTB (Lei nº 14.599/2023)',
    answer: true,
    explanation:
      'CORRETO. Conforme os Arts. 148-A e 165-B do CTB (atualizados pela Lei nº 14.599/2023), condutores das categorias C, D e E com menos de 70 anos devem realizar exame toxicológico periódico a cada 2 anos e 6 meses. Dirigir após 30 dias do vencimento acarreta infração gravíssima.',
    coreStatements: [
      'Condutores habilitados nas categorias C, D ou E com menos de 70 anos de idade devem submeter-se a novo exame toxicológico a cada período de dois anos e seis meses, contados da obtenção ou renovação da CNH.',
      'A periodicidade do exame toxicológico intermediário para motoristas das categorias C, D e E com idade inferior a setenta anos é de trinta meses (dois anos e meio), independentemente de exercerem atividade remunerada.',
      'Para manter a regularidade da habilitação nas categorias C, D e E antes dos 70 anos, exige-se a realização de exame toxicológico de larga janela de detecção a cada dois anos e seis meses.',
    ],
  },
  {
    id: 'ctb-08',
    category: 'CTB',
    topic: 'CTB - Sistema Nacional de Trânsito e Competências da PRF',
    legalScope: 'Art. 20 do CTB',
    legalBasis: 'Art. 20, IX e XI, do CTB',
    answer: true,
    explanation:
      'CORRETO. Compete à Polícia Rodoviária Federal, no âmbito das rodovias e estradas federais, fiscalizar o nível de emissão de poluentes e ruído, realizar perícia de trânsito e lavrar termo circunstanciado de ocorrência (TCO) nas hipóteses autorizadas por lei e decisões do STF.',
    coreStatements: [
      'No âmbito das rodovias e estradas federais, compete à Polícia Rodoviária Federal executar a fiscalização de trânsito, autuar e aplicar as penalidades de advertência por escrito e multas por infrações de circulação.',
      'A realização de perícia de sinistros de trânsito nas rodovias federais e a fiscalização de medidas administrativas constituem atribuições legalmente conferidas à Polícia Rodoviária Federal pelo CTB.',
      'A PRF detém competência para fiscalizar veículos de carga e transporte de produtos perigosos ao longo de toda a malha rodoviária federal.',
    ],
  },
  {
    id: 'ctb-09',
    category: 'CTB',
    topic: 'CTB - Crimes: Homicídio e Lesão Corporal Culposa',
    legalBasis: 'Art. 302, § 3º, e Art. 312-B do CTB',
    answer: true,
    explanation:
      'CORRETO. No crime de homicídio culposo ao volante praticado sob efeito de álcool (Art. 302, § 3º), a pena é de reclusão de 5 a 8 anos e o Art. 312-B do CTB proíbe a substituição da pena privativa de liberdade por restritivas de direitos.',
    coreStatements: [
      'No crime de homicídio culposo na direção de veículo automotor qualificado pela embriaguez ao volante, é legalmente vedada a substituição da pena privativa de liberdade por restritivas de direitos.',
      'O Art. 312-B do CTB impede que o magistrado converta a pena privativa de liberdade em restritiva de direitos nos delitos de homicídio culposo ou lesão grave qualificados por álcool ou drogas.',
      'O condutor embriagado que praticar homicídio culposo ao volante sujeita-se à pena de reclusão e não faz jus à substituição por penas alternativas de direitos.',
    ],
  },
  {
    id: 'ctb-10',
    category: 'CTB',
    topic: 'CTB - Medidas Administrativas: Retenção e Remoção',
    legalBasis: 'Art. 271, § 9º-A, do CTB',
    answer: false,
    explanation:
      'ERRADO. Pelo Art. 271, § 9º-A, do CTB, quando a irregularidade puder ser sanada no local da infração, o veículo será liberado tão logo seja regularizada a situação, NÃO cabendo a remoção ao depósito.',
    coreStatements: [
      'Mesmo quando o condutor consegue sanar integralmente no local da abordagem a irregularidade que motivou a retenção do veículo, a autoridade de trânsito permanece obrigada a efetuar sua remoção ao depósito.',
      'A constatação de licenciamento atrasado impõe a imediata remoção do veículo ao pátio da PRF, sendo vedada a liberação ainda que o proprietário efetue a quitação eletrônica dos débitos na hora da blitz.',
      'A medida administrativa de remoção do veículo independe da possibilidade de saneamento do vício no próprio local da fiscalização.',
    ],
  },

  // ==================== RESOLUÇÕES DO CONTRAN ====================
  {
    id: 'contran-01',
    category: 'CONTRAN',
    topic: 'CONTRAN - Res. 996/2023 (Ciclomotores e Bikes Elétricas)',
    legalBasis: 'Resolução CONTRAN nº 996/2023',
    answer: true,
    explanation:
      'CORRETO. Conforme a Resolução CONTRAN nº 996/2023, os equipamentos de mobilidade autopropelidos (patinetes, monociclos) com velocidade máxima até 32 km/h estão dispensados de registro, licenciamento e CNH/ACC.',
    coreStatements: [
      'Nos termos da Resolução CONTRAN nº 996/2023, os equipamentos de mobilidade individual autopropelidos com velocidade máxima até 32 km/h estão dispensados de registro, emplacamento e habilitação.',
      'Segundo a regulamentação do CONTRAN sobre micromobilidade (Res. 996/2023), não se exige CNH, ACC nem licenciamento para a condução de equipamentos autopropelidos que respeitem o limite de 32 km/h.',
      'Diferentemente dos ciclomotores, os veículos classificados como equipamentos autopropelidos pela Resolução nº 996/2023 do CONTRAN independem de registro no órgão de trânsito.',
    ],
  },
  {
    id: 'contran-02',
    category: 'CONTRAN',
    topic: 'CONTRAN - Res. 432/2013 (Fiscalização de Alcoolemia)',
    legalBasis: 'Resolução CONTRAN nº 432/2013 (Art. 5º e Anexo I)',
    answer: false,
    explanation:
      'ERRADO. Pela Resolução CONTRAN nº 432/2013, o auto de infração considera o Valor Considerado (descontado o erro máximo admissível de 0,04 mg/L). Qualquer medição realizada igual ou superior a 0,05 mg/L já configura infração administrativa (VC >= 0,01 mg/L). Não existe tolerância de 0,10 mg/L no etilômetro!',
    coreStatements: [
      'Segundo a Resolução CONTRAN nº 432/2013, a infração administrativa por alcoolemia somente resta configurada quando a medição realizada pelo etilômetro for igual ou superior a 0,10 mg de álcool por litro de ar alveolar.',
      'A margem de tolerância técnica prevista pelo CONTRAN para o teste do etilômetro permite que o condutor apresente medição realizada de até 0,09 mg/L sem sofrer autuação administrativa.',
      'Conforme a tabela de valores referenciais da Resolução nº 432/2013 do CONTRAN, medições no etilômetro inferiores a 0,10 mg/L são descartadas para fins de autuação no Art. 165 do CTB.',
    ],
  },
  {
    id: 'contran-03',
    category: 'CONTRAN',
    topic: 'CONTRAN - Res. 798/2020 (Radares e Medidores de Velocidade)',
    legalBasis: 'Resolução CONTRAN nº 798/2020',
    answer: true,
    explanation:
      'CORRETO. A Resolução CONTRAN nº 798/2020 veda expressamente a utilização de equipamentos medidores de velocidade ocultos ou escondidos, exigindo a visibilidade do instrumento e prévia sinalização vertical R-19.',
    coreStatements: [
      'A Resolução CONTRAN nº 798/2020 proíbe expressamente a operação de radares portáteis ou móveis em locais ocultos ou desprovidos de prévia visibilidade pelo condutor na rodovia.',
      'É vedado pelo CONTRAN o uso de medidores de velocidade instalados de forma escondida ou camuflada, devendo a fiscalização ser visível e precedida de placa R-19.',
      'A legalidade da fiscalização eletrônica de velocidade em rodovias federais pressupõe a observância do princípio da publicidade, sendo ilegal a utilização de radares ocultos sob a égide da Res. 798/2020.',
    ],
  },
  {
    id: 'contran-04',
    category: 'CONTRAN',
    topic: 'CONTRAN - Res. 810/2020 (Classificação de Danos em Sinistros)',
    legalBasis: 'Resolução CONTRAN nº 810/2020',
    answer: false,
    explanation:
      'ERRADO. Pela Resolução CONTRAN nº 810/2020, o sinistro de "Pequena Monta" NÃO acarreta bloqueio administrativo no registro do veículo. É a "Média Monta" que gera bloqueio no RENAVAM até realização de vistoria para Certificado de Segurança Veicular (CSV).',
    coreStatements: [
      'De acordo com a Resolução CONTRAN nº 810/2020, a classificação do veículo sinistrado em Pequena Monta pelo policial rodoviário federal acarreta o bloqueio imediato do CRLV no sistema RENAVAM.',
      'O laudo de avarias com enquadramento em Pequena Monta impede a circulação do veículo até a emissão de novo Certificado de Segurança Veicular (CSV).',
      'Tanto na Pequena quanto na Média Monta, o veículo sofre restrição administrativa automática no órgão executivo de trânsito até aprovação em inspeção técnica de segurança.',
    ],
  },
  {
    id: 'contran-05',
    category: 'CONTRAN',
    topic: 'CONTRAN - Res. 955/2022 (Capacete Motociclístico e Viseira)',
    legalBasis: 'Resolução CONTRAN nº 955/2022',
    answer: true,
    explanation:
      'CORRETO. Segundo a Resolução CONTRAN nº 955/2022, no período noturno, a viseira ou os óculos de proteção devem ser obrigatoriamente no padrão cristal (transparente), sendo proibida viseira fumê ou espelhada à noite.',
    coreStatements: [
      'Durante o período noturno, a viseira do capacete utilizado pelo condutor de motocicleta deve ser obrigatoriamente no padrão cristal (transparente), sendo vedado o uso de viseira fumê ou metalizada.',
      'A regulamentação do CONTRAN proíbe a circulação noturna de motociclistas com viseira fumê ou película escura, mesmo em rodovias iluminadas.',
      'Nos termos da Resolução CONTRAN nº 955/2022, o motociclista flagrado conduzindo veículo à noite com capacete de viseira escura comete infração de trânsito.',
    ],
  },
  {
    id: 'contran-06',
    category: 'CONTRAN',
    topic: 'CONTRAN - Res. 960/2022 (Vidros e Películas / Insulfilm)',
    legalBasis: 'Resolução CONTRAN nº 960/2022',
    answer: true,
    explanation:
      'CORRETO. A Resolução CONTRAN nº 960/2022 exige transmitância luminosa não inferior a 70% para o para-brisa e vidros laterais dianteiros, e proíbe terminantemente películas espelhadas ou opacas.',
    coreStatements: [
      'Nos termos da Resolução CONTRAN nº 960/2022, a transmitância luminosa da película aplicada no para-brisa e nos vidros laterais dianteiros dos veículos não pode ser inferior a 70%.',
      'É vedada expressamente pelo CONTRAN a aplicação de películas retrorrefletivas ou espelhadas nos vidros de veículos automotores em circulação.',
      'Para a área indispensável à dirigibilidade (para-brisa e laterais dianteiros), a Resolução 960/2022 do CONTRAN fixou em 70% o índice mínimo de transmissão luminosa.',
    ],
  },
  {
    id: 'contran-07',
    category: 'CONTRAN',
    topic: 'CONTRAN - Res. 925/2022 e 926/2022 (Amarração de Cargas e CVC)',
    legalBasis: 'Resolução CONTRAN nº 926/2022',
    answer: false,
    explanation:
      'ERRADO. A Resolução CONTRAN nº 926/2022 PROÍBE expressamente a utilização de cordas como dispositivo primário de amarração e fixação de carga em caminhões e carrocerias abertas, sendo obrigatório o uso de cintas têxteis, correntes ou cabos de aço.',
    coreStatements: [
      'A Resolução CONTRAN nº 926/2022 autoriza o uso de cordas de polietileno como meio exclusivo e primário para a fixação de cargas pesadas em veículos de carroceria aberta.',
      'Em caminhões que transportem madeira ou bobinas de aço em rodovias, é admitida a amarração principal da carga unicamente por meio de cordas de fibra sintética.',
      'A fiscalização da PRF não pode autuar o transporte de carga fixado exclusivamente por cordas, haja vista que a Resolução CONTRAN 926/2022 considera as cordas equivalentes a cintas de poliéster.',
    ],
  },
  {
    id: 'contran-08',
    category: 'CONTRAN',
    topic: 'CONTRAN - Res. 985/2022 (Manual de Fiscalização - MBFT)',
    legalBasis: 'Resolução CONTRAN nº 985/2022 (MBFT)',
    answer: true,
    explanation:
      'CORRETO. Segundo o Manual Brasileiro de Fiscalização de Trânsito (MBFT, Res. 985/2022), a abordagem do condutor é dispensada quando a infração puder ser constatada visualmente em movimento (como uso de celular, não uso de cinto ou excesso de velocidade por radar), devendo o agente justificar detalhadamente a não abordagem no campo observações do AIT.',
    coreStatements: [
      'De acordo com o Manual Brasileiro de Fiscalização de Trânsito (MBFT), nas infrações constatadas visualmente sem que seja viável a parada do veículo em rodovia, o policial pode lavrar o AIT registrando a justificativa no campo observações.',
      'A ausência de abordagem do condutor não invalida o auto de infração quando a fiscalização ocorrer em movimento e o agente detalhar o motivo no campo observações, segundo a Res. 985/2022 do CONTRAN.',
      'O MBFT autoriza a autuação sem abordagem do condutor para infrações de visibilidade externa, exigindo a declaração formal do agente sobre a impossibilidade da abordagem.',
    ],
  },
  {
    id: 'contran-09',
    category: 'CONTRAN',
    topic: 'CONTRAN - Res. 967/2022 (Transporte de Produtos Perigosos)',
    legalBasis: 'Resolução CONTRAN nº 967/2022',
    answer: true,
    explanation:
      'CORRETO. Os veículos destinados ao transporte de produtos perigosos devem ostentar obrigatoriamente painéis de segurança de cor laranja (indicando número de risco e número ONU) e rótulos de risco losangulares correspondentes à classe do produto transportado.',
    coreStatements: [
      'Veículos transportadores de cargas perigosas em rodovias federais devem portar painel de segurança retangular laranja com número ONU e rótulo de risco conforme as normas do CONTRAN.',
      'A ausência de painel de segurança laranja ou de rótulo de risco em caminhão transportando produto químico perigoso constitui infração grave com retenção do veículo.',
      'Nos termos da Resolução CONTRAN nº 967/2022, o transporte fracionado ou a granel de produtos perigosos sujeita-se à identificação externa por placas retangulares laranjas e losangos de risco.',
    ],
  },
  {
    id: 'contran-10',
    category: 'CONTRAN',
    topic: 'CONTRAN - Res. 919/2022 (Extintor de Incêndio Veicular)',
    legalBasis: 'Resolução CONTRAN nº 919/2022',
    answer: false,
    explanation:
      'ERRADO. Pela Resolução CONTRAN nº 919/2022, o extintor de incêndio com carga de pó ABC é FACULTATIVO para automóveis, caminhonetes, utilitários e camionetas de uso particular. É obrigatório apenas para transporte coletivo, micro-ônibus, ônibus, caminhões e transporte de inflamáveis.',
    coreStatements: [
      'Conforme a Resolução CONTRAN nº 919/2022, é obrigatório o porte de extintor de incêndio com carga de pó ABC em todos os automóveis de passeio em circulação nas rodovias federais.',
      'A fiscalização da PRF deve autuar o motorista de automóvel particular que estiver com o extintor de incêndio vencido ou desprovido do equipamento.',
      'A obrigatoriedade do extintor veicular de pó ABC permanece vigente para todos os veículos automotores de quatro ou mais rodas no território nacional.',
    ],
  },
];

// Combinador Sintético Cebraspe para garantir 0% de repetição
const CEBRASPE_PREFIXES_CTB = [
  'Julgue o item a seguir à luz do Código de Trânsito Brasileiro:',
  'Acerca das disposições da Lei nº 9.503/1997 (CTB) e suas atualizações, julgue:',
  'No que se refere às normas gerais, infrações e crimes previstos no CTB, avalie a assertiva:',
  'Considerando a legislação de trânsito vigente aplicável em todo o território nacional, julgue o item:',
  'Com base nas regras positivadas no Código de Trânsito Brasileiro, julgue a proposição:',
  'Sob a ótica da jurisprudência e da literalidade do CTB em vigor, analise a afirmação:',
  'Em situação de fiscalização viária regida pelo Código de Trânsito Brasileiro, julgue:',
];

const CEBRASPE_PREFIXES_CONTRAN = [
  'Julgue o item subsequente de acordo com as Resoluções vigentes do CONTRAN:',
  'À luz da regulamentação normativa expedida pelo Conselho Nacional de Trânsito (CONTRAN), julgue:',
  'No que tange às normas infralegais e resoluções atualizadas do CONTRAN, avalie o item:',
  'Considerando as diretrizes técnicas fixadas em Resolução do CONTRAN, julgue a assertiva:',
  'Com fundamento nos atos normativos do CONTRAN aplicáveis à fiscalização de trânsito, julgue:',
  'A respeito dos parâmetros operacionais regulamentados pelo CONTRAN, analise a proposição:',
  'Em conformidade com o arcabouço normativo do CONTRAN em vigor, julgue o seguinte item:',
];

const CEBRASPE_CONNECTORS = [
  '',
  ' Nessa hipótese normativa, verifica-se a validade integral do preceito descrito.',
  ' Tal diretriz aplica-se de forma vinculante aos órgãos do Sistema Nacional de Trânsito.',
  ' Esse entendimento observa estritamente os parâmetros legais vigentes.',
  ' A referida regra incide nas operações regulares de fiscalização de trânsito.',
  ' Cumpre aos agentes da autoridade de trânsito observar rigorosamente tal comando.',
];

const SYNONYM_PAIRS: Array<[RegExp, string[]]> = [
  [/\bcondutor\b/gi, ['condutor', 'motorista', 'dirigente do veículo', 'condutor abordado']],
  [/\bcondutores\b/gi, ['condutores', 'motoristas', 'usuários habilitados']],
  [/\bveículo\b/gi, ['veículo', 'automotor', 'veículo em circulação']],
  [/\bautoridade de trânsito\b/gi, ['autoridade de trânsito', 'dirigente do órgão executivo de trânsito', 'autoridade competente de trânsito']],
  [/\binfração gravíssima\b/gi, ['infração gravíssima', 'infração de natureza gravíssima', 'ilícito administrativo gravíssimo']],
  [/\bperímetro urbano\b/gi, ['perímetro urbano', 'área urbanizada', 'zona urbana']],
  [/\brodovias\b/gi, ['rodovias', 'vias rurais pavimentadas (rodovias)', 'malha rodoviária']],
  [/\bobrigatório\b/gi, ['obrigatório', 'compulsório', 'exigido por norma']],
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function synthesizeUniqueCebraspeStatement(
  base: BaseLegalQuestion,
  seenStatements: Set<string>,
  rewriteGenerationCount: number
): string {
  const prefixes = base.category === 'CTB' ? CEBRASPE_PREFIXES_CTB : CEBRASPE_PREFIXES_CONTRAN;

  for (let attempt = 0; attempt < 40; attempt++) {
    const core = pickRandom(base.coreStatements);
    const prefix = pickRandom(prefixes);
    const suffix = attempt > 2 ? pickRandom(CEBRASPE_CONNECTORS) : '';

    let transformed = core;
    for (const [regex, replacements] of SYNONYM_PAIRS) {
      if (Math.random() > 0.35 || attempt > 5) {
        transformed = transformed.replace(regex, (match) => {
          const chosen = pickRandom(replacements);
          if (match[0] === match[0].toUpperCase()) {
            return chosen.charAt(0).toUpperCase() + chosen.slice(1);
          }
          return chosen;
        });
      }
    }

    const candidate = `${prefix} ${transformed}${suffix}`.replace(/\s+/g, ' ').trim();
    if (!seenStatements.has(candidate)) {
      seenStatements.add(candidate);
      return candidate;
    }
  }

  const fallbackCore = pickRandom(base.coreStatements);
  const fallbackPrefix = pickRandom(prefixes);
  const uniqueVariant = `${fallbackPrefix} [Caso Prático #${rewriteGenerationCount + Math.floor(Math.random() * 900 + 100)}] ${fallbackCore}`;
  seenStatements.add(uniqueVariant);
  return uniqueVariant;
}
