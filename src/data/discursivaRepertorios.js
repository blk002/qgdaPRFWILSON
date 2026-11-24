export const EIXOS_PRF = [
  {
    id: 'seguranca_viaria',
    label: 'Segurança Viária e Trânsito',
    shortLabel: 'Segurança Viária',
    dotClass: 'bg-sky-500',
    textClass: 'text-sky-700 dark:text-sky-400',
    softBgClass: 'bg-sky-500/10 border-sky-500/20'
  },
  {
    id: 'seguranca_publica',
    label: 'Segurança Pública e Combate ao Crime',
    shortLabel: 'Segurança Pública',
    dotClass: 'bg-indigo-500',
    textClass: 'text-indigo-700 dark:text-indigo-400',
    softBgClass: 'bg-indigo-500/10 border-indigo-500/20'
  },
  {
    id: 'direitos_humanos',
    label: 'Direitos Humanos e Ética Policial',
    shortLabel: 'Direitos Humanos',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    softBgClass: 'bg-emerald-500/10 border-emerald-500/20'
  },
  {
    id: 'tecnologia_gestao',
    label: 'Tecnologia, Inteligência e Gestão',
    shortLabel: 'Tecnologia & Gestão',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-700 dark:text-amber-400',
    softBgClass: 'bg-amber-500/10 border-amber-500/20'
  },
  {
    id: 'meio_ambiente',
    label: 'Meio Ambiente e Rodovias',
    shortLabel: 'Meio Ambiente',
    dotClass: 'bg-teal-500',
    textClass: 'text-teal-700 dark:text-teal-400',
    softBgClass: 'bg-teal-500/10 border-teal-500/20'
  }
];

export const TIPOS_REPERTORIO = [
  { id: 'legislacao', label: 'Legislação' },
  { id: 'politica_publica', label: 'Política Pública' },
  { id: 'dado_oficial', label: 'Dado / Órgão' },
  { id: 'conceito_autor', label: 'Conceito / Autor' }
];

export const CURATED_REPERTORIOS = [
  // ================= SEGURANÇA VIÁRIA =================
  {
    id: 'rep_ctb_art1',
    eixo: 'seguranca_viaria',
    tipo: 'legislacao',
    titulo: 'Trânsito Seguro como Direito Fundamental de Cidadania',
    fonte: 'Art. 1º, §2º do CTB (Lei nº 9.503/1997)',
    aspectoTipico: 'Fundamentação legal',
    resumo:
      'Estabelece que o trânsito em condições seguras é um direito de todos e dever prioritário dos órgãos e entidades componentes do Sistema Nacional de Trânsito (SNT).',
    comoUsar:
      'Consoante o art. 1º, §2º, do Código de Trânsito Brasileiro, o trânsito em condições seguras constitui direito de todos e dever prioritário dos órgãos do Sistema Nacional de Trânsito, o que legitima a atuação preventiva e fiscalizatória da Polícia Rodoviária Federal.',
    palavrasChave: ['ctb', 'trânsito seguro', 'snt', 'direito de todos', 'prevenção', 'fiscalização']
  },
  {
    id: 'rep_pnatrans',
    eixo: 'seguranca_viaria',
    tipo: 'politica_publica',
    titulo: 'PNATRANS — Plano Nacional de Redução de Mortes e Lesões no Trânsito',
    fonte: 'Lei nº 13.614/2018 (alterada pela Lei nº 14.071/2020)',
    aspectoTipico: 'Política pública / Metas',
    resumo:
      'Política pública estruturada em pilares (gestão, vias seguras, segurança veicular, educação, atendimento às vítimas e normatização) com a meta de reduzir em pelo menos 50% o índice de mortes no trânsito em dez anos.',
    comoUsar:
      'Nesse contexto, o Plano Nacional de Redução de Mortes e Lesões no Trânsito (PNATRANS) evidencia que a diminuição da letalidade viária exige ações integradas de engenharia, educação para o trânsito e fiscalização ostensiva baseada em dados.',
    palavrasChave: ['pnatrans', 'mortes no trânsito', 'sinistros', 'redução', '50%', 'pilares']
  },
  {
    id: 'rep_lei_seca',
    eixo: 'seguranca_viaria',
    tipo: 'legislacao',
    titulo: 'Lei Seca e Tolerância Zero à Alcoolemia na Direção',
    fonte: 'Lei nº 11.705/2008 · Lei nº 12.760/2012 · Arts. 165 e 306 do CTB',
    aspectoTipico: 'Repressão e prevenção',
    resumo:
      'Endureceu a responsabilização administrativa e penal para condução sob influência de álcool ou substância psicoativa, admitindo diversos meios de prova (etilômetro, exame clínico, perícia, vídeo e testemunhas).',
    comoUsar:
      'A aplicação rigorosa da denominada Lei Seca, amparada pelos arts. 165 e 306 do CTB, demonstra que a combinação entre fiscalização contínua e efetiva responsabilização administrativa e penal reduz drasticamente sinistros graves em rodovias federais.',
    palavrasChave: ['lei seca', 'álcool', 'embriaguez', 'etilômetro', 'art 165', 'art 306']
  },
  {
    id: 'rep_onu_decada',
    eixo: 'seguranca_viaria',
    tipo: 'dado_oficial',
    titulo: 'Década de Ação pela Segurança no Trânsito (2021–2030) e ODS 3.6',
    fonte: 'ONU / Organização Mundial da Saúde (OMS)',
    aspectoTipico: 'Contextualização internacional',
    resumo:
      'A ONU estabeleceu a segunda Década de Ação com a meta global de reduzir em 50% mortes e lesões no trânsito até 2030, adotando o enfoque de Sistema Seguro (Safe System), que reconhece a falibilidade humana e exige vias e controles tolerantes ao erro.',
    comoUsar:
      'Alinhada à Década de Ação pela Segurança no Trânsito (2021–2030) da ONU e à abordagem de Sistema Seguro, a atuação estatal deve superar a visão exclusivamente punitiva, incorporando infraestrutura segura, gestão de velocidade e educação contínua.',
    palavrasChave: ['onu', 'oms', 'ods', 'sistema seguro', 'safe system', '2030', 'letalidade']
  },
  {
    id: 'rep_educacao_transito',
    eixo: 'seguranca_viaria',
    tipo: 'legislacao',
    titulo: 'Educação para o Trânsito e Prevenção Primária',
    fonte: 'Arts. 74 a 79 do CTB · Movimento Maio Amarelo',
    aspectoTipico: 'Proposta / Solução educativa',
    resumo:
      'Prevê que a educação para o trânsito é direito de todos e dever prioritário dos componentes do SNT, com coordenação educacional contínua nas escolas e campanhas permanentes como o Cinema Rodoviário da PRF.',
    comoUsar:
      'Para consolidar uma cultura de preservação de vidas, impõe-se fortalecer a educação para o trânsito prevista nos arts. 74 a 79 do CTB, ampliando iniciativas preventivas como o Cinema Rodoviário da PRF e campanhas educativas permanentes.',
    palavrasChave: ['educação', 'cinema rodoviário', 'maio amarelo', 'prevenção primária', 'cultura de paz']
  },

  // ================= SEGURANÇA PÚBLICA =================
  {
    id: 'rep_cf_144_prf',
    eixo: 'seguranca_publica',
    tipo: 'legislacao',
    titulo: 'Atribuição Constitucional da Polícia Rodoviária Federal',
    fonte: 'Art. 144, §2º da Constituição Federal de 1988',
    aspectoTipico: 'Competência institucional',
    resumo:
      'Define a PRF como órgão permanente, organizado e mantido pela União e estruturado em carreira, destinado, na forma da lei, ao patrulhamento ostensivo das rodovias federais.',
    comoUsar:
      'Nos termos do art. 144, §2º, da Constituição Federal, incumbe à Polícia Rodoviária Federal o patrulhamento ostensivo das rodovias federais, missão que transcende a segurança viária ao alcançar o enfrentamento qualificado à criminalidade interestadual e transnacional.',
    palavrasChave: ['art 144', 'constituição', 'patrulhamento ostensivo', 'rodovias federais', 'competência']
  },
  {
    id: 'rep_susp',
    eixo: 'seguranca_publica',
    tipo: 'politica_publica',
    titulo: 'SUSP — Sistema Único de Segurança Pública',
    fonte: 'Lei nº 13.675/2018',
    aspectoTipico: 'Integração entre forças',
    resumo:
      'Institui a Política Nacional de Segurança Pública e Defesa Social, promovendo atuação conjunta, coordenada, sistêmica e integrada dos órgãos de segurança pública da União, dos Estados, do DF e dos Municípios.',
    comoUsar:
      'A efetividade do enfrentamento ao crime organizado nas rodovias depende da plena operacionalização do Sistema Único de Segurança Pública (Lei nº 13.675/2018), mediante compartilhamento de inteligência e operações integradas entre forças federais e estaduais.',
    palavrasChave: ['susp', 'integração', 'cooperação', 'inteligência', 'segurança pública', 'lei 13675']
  },
  {
    id: 'rep_projeto_mapear',
    eixo: 'seguranca_publica',
    tipo: 'politica_publica',
    titulo: 'Projeto Mapear — Enfrentamento à Exploração Sexual Infantil',
    fonte: 'Polícia Rodoviária Federal (PRF) · Childhood Brasil',
    aspectoTipico: 'Atuação social da PRF',
    resumo:
      'Iniciativa consolidada da PRF que mapeia bienalmente pontos vulneráveis à exploração sexual de crianças e adolescentes às margens das rodovias federais, subsidiando políticas públicas e ações repressivas.',
    comoUsar:
      'Como exemplo concreto de policiamento preventivo e protetivo, destaca-se o Projeto Mapear, conduzido pela PRF para identificar pontos vulneráveis à exploração sexual infantojuvenil nas rodovias federais e articular a rede de proteção social.',
    palavrasChave: ['mapear', 'crianças', 'adolescentes', 'exploração sexual', 'vulneráveis', 'eca']
  },
  {
    id: 'rep_trabalho_escravo',
    eixo: 'seguranca_publica',
    tipo: 'legislacao',
    titulo: 'Combate ao Trabalho Análogo à Escravidão e ao Tráfico de Pessoas',
    fonte: 'Art. 149 do Código Penal · Lei nº 13.344/2016',
    aspectoTipico: 'Direitos humanos e repressão',
    resumo:
      'A PRF integra forças-tarefa com o Ministério Público do Trabalho e Auditores-Fiscais no resgate de trabalhadores submetidos a condições degradantes e na interceptação de rotas de tráfico de pessoas.',
    comoUsar:
      'No enfrentamento ao tráfico de pessoas (Lei nº 13.344/2016) e à redução à condição análoga à de escravo (art. 149 do CP), a capilaridade da PRF nas rodovias viabiliza a interceptação de rotas ilícitas e o suporte operacional a forças-tarefa de resgate.',
    palavrasChave: ['trabalho escravo', 'tráfico de pessoas', 'art 149', 'resgate', 'força-tarefa']
  },
  {
    id: 'rep_narcotrafico_fronteiras',
    eixo: 'seguranca_publica',
    tipo: 'legislacao',
    titulo: 'Repressão ao Tráfico de Drogas e Armas nos Corredores Rodoviários',
    fonte: 'Lei nº 11.343/2006 · Lei nº 10.826/2003 · Programa Protetor',
    aspectoTipico: 'Combate ao crime organizado',
    resumo:
      'As rodovias federais funcionam como principal eixo logístico de escoamento de entorpecentes e armas vindos de faixas de fronteira; a interceptação rodoviária descapitaliza facções e reduz a violência urbana.',
    comoUsar:
      'Considerando que a malha rodoviária federal concentra o escoamento logístico do narcotráfico e do tráfico de armas, o policiamento orientado por inteligência e a cooperação em faixas de fronteira são decisivos para desarticular organizações criminosas.',
    palavrasChave: ['drogas', 'armas', 'fronteira', 'crime organizado', 'narcotráfico', 'descapitalização']
  },
  {
    id: 'rep_contrabando_descaminho',
    eixo: 'seguranca_publica',
    tipo: 'legislacao',
    titulo: 'Enfrentamento ao Contrabando e Descaminho nas Rodovias',
    fonte: 'Arts. 334 e 334-A do Código Penal',
    aspectoTipico: 'Impacto econômico e fiscal',
    resumo:
      'Crimes transfronteiriços que geram evasão fiscal bilionária, concorrência desleal, financiamento de organizações criminosas e riscos diretos à saúde pública (cigarros, medicamentos e agrotóxicos ilegais).',
    comoUsar:
      'Além do prejuízo à arrecadação tributária e à indústria nacional, o contrabando e o descaminho (arts. 334 e 334-A do CP) financiam estruturas criminosas complexas e expõem a população a produtos sem controle sanitário.',
    palavrasChave: ['contrabando', 'descaminho', 'economia', 'saúde pública', 'fronteira', 'receita']
  },

  // ================= DIREITOS HUMANOS & ÉTICA =================
  {
    id: 'rep_dignidade_cf',
    eixo: 'direitos_humanos',
    tipo: 'legislacao',
    titulo: 'Dignidade da Pessoa Humana como Fundamento da Atividade Policial',
    fonte: 'Art. 1º, III e Art. 5º da Constituição Federal de 1988',
    aspectoTipico: 'Base constitucional',
    resumo:
      'A dignidade da pessoa humana é fundamento da República e impõe que toda ação policial seja pautada pela legalidade estrita, impessoalidade e respeito irrestrito aos direitos e garantias fundamentais.',
    comoUsar:
      'Sob a égide da Constituição de 1988, a segurança pública não se opõe aos direitos humanos; ao contrário, tem na dignidade da pessoa humana (art. 1º, III) o parâmetro de legitimidade e o limite ético-jurídico de toda intervenção policial.',
    palavrasChave: ['dignidade', 'direitos fundamentais', 'constituição', 'cidadania', 'ética policial']
  },
  {
    id: 'rep_uso_forca_onu',
    eixo: 'direitos_humanos',
    tipo: 'politica_publica',
    titulo: 'Uso Diferenciado da Força e Código de Conduta da ONU',
    fonte: 'Princípios Básicos da ONU (1990) · Lei nº 13.060/2014',
    aspectoTipico: 'Ética e técnica policial',
    resumo:
      'Estabelece que o emprego da força por agentes de segurança deve obedecer rigorosamente aos princípios da legalidade, necessidade, proporcionalidade, moderação e conveniência, priorizando instrumentos de menor potencial ofensivo.',
    comoUsar:
      'A atuação policial qualificada pressupõe o estrito cumprimento da Lei nº 13.060/2014 e dos princípios internacionais do uso diferenciado da força — legalidade, necessidade e proporcionalidade —, assegurando proteção simultânea ao cidadão e ao agente público.',
    palavrasChave: ['uso da força', 'proporcionalidade', 'menor potencial ofensivo', 'onu', 'lei 13060']
  },
  {
    id: 'rep_abuso_autoridade',
    eixo: 'direitos_humanos',
    tipo: 'legislacao',
    titulo: 'Controle Institucional e Prevenção ao Abuso de Autoridade',
    fonte: 'Lei nº 13.869/2019 · Princípio da Responsabilidade Funcional',
    aspectoTipico: 'Corregedoria e controle',
    resumo:
      'Tipifica condutas abusivas praticadas por agentes públicos com finalidade específica de prejudicar outrem ou beneficiar a si ou terceiro, reforçando a transparência, a corregedoria e a confiança social nas instituições.',
    comoUsar:
      'O fortalecimento de mecanismos de controle interno, capacitação continuada e observância da Lei de Abuso de Autoridade (Lei nº 13.869/2019) elevam a legitimidade institucional e ampliam a confiança da sociedade no trabalho policial.',
    palavrasChave: ['abuso de autoridade', 'corregedoria', 'controle', 'transparência', 'legalidade']
  },
  {
    id: 'rep_grupos_vulneraveis',
    eixo: 'direitos_humanos',
    tipo: 'legislacao',
    titulo: 'Proteção a Grupos Vulneráveis e Abordagem Humanizada',
    fonte: 'ECA (Lei 8.069/90) · Lei Maria da Penha (11.340/06) · Estatuto da Pessoa Idosa',
    aspectoTipico: 'Proteção social',
    resumo:
      'Determina proteção integral e atendimento prioritário e humanizado a crianças, adolescentes, mulheres em situação de violência e pessoas idosas, evitando revitimização durante ocorrências policiais.',
    comoUsar:
      'O atendimento policial a grupos vulneráveis exige protocolos de escuta qualificada e articulação imediata com a rede de proteção, em consonância com o Estatuto da Criança e do Adolescente e a Lei Maria da Penha, prevenindo a revitimização.',
    palavrasChave: ['vulneráveis', 'mulheres', 'idosos', 'crianças', 'revitimização', 'acolhimento']
  },
  {
    id: 'rep_bobbio_direitos',
    eixo: 'direitos_humanos',
    tipo: 'conceito_autor',
    titulo: 'A Efetivação Prática dos Direitos Fundamentais',
    fonte: 'Norberto Bobbio — "A Era dos Direitos"',
    aspectoTipico: 'Argumentação / Problema',
    resumo:
      'O jurista italiano destaca que o grande desafio contemporâneo em relação aos direitos humanos não é mais justificá-los teoricamente, mas criar mecanismos concretos para protegê-los e efetivá-los na prática.',
    comoUsar:
      'Conforme observa o jurista Norberto Bobbio, o desafio central dos direitos humanos na contemporaneidade não reside em sua fundamentação teórica, mas em sua efetiva proteção prática — lacuna que demanda políticas públicas contínuas e fiscalização estatal eficiente.',
    palavrasChave: ['bobbio', 'efetividade', 'direitos humanos', 'proteção prática', 'filosofia jurídica']
  },

  // ================= TECNOLOGIA & GESTÃO =================
  {
    id: 'rep_eficiencia_art37',
    eixo: 'tecnologia_gestao',
    tipo: 'legislacao',
    titulo: 'Princípio da Eficiência e Governança Pública',
    fonte: 'Art. 37, caput, da Constituição Federal (EC nº 19/1998)',
    aspectoTipico: 'Gestão pública',
    resumo:
      'Impõe à Administração Pública a busca por resultados concretos, alocação racional de recursos, celeridade e excelência na prestação do serviço à população.',
    comoUsar:
      'Em observância ao princípio constitucional da eficiência (art. 37 da CF/88), a modernização tecnológica da atividade policial otimiza recursos públicos e amplia a capacidade de resposta preventiva em trechos rodoviários estratégicos.',
    palavrasChave: ['eficiência', 'art 37', 'administração pública', 'governança', 'resultados']
  },
  {
    id: 'rep_sinesp_interoperabilidade',
    eixo: 'tecnologia_gestao',
    tipo: 'politica_publica',
    titulo: 'SINESP, Leitura Automática de Placas (OCR) e Inteligência Policial',
    fonte: 'Lei nº 12.681/2012 (SINESP) · Cercamento Eletrônico',
    aspectoTipico: 'Solução tecnológica',
    resumo:
      'A integração de bases de dados criminais e veiculares associada a sistemas de videomonitoramento e leitura óptica de placas permite identificar veículos roubados/clonados e rotas ilícitas em tempo real.',
    comoUsar:
      'A integração de sistemas como o SINESP ao cercamento eletrônico com leitura automática de placas (OCR) potencializa o policiamento orientado por inteligência, aumentando a taxa de recuperação de veículos e a precisão das abordagens.',
    palavrasChave: ['sinesp', 'ocr', 'videomonitoramento', 'inteligência', 'dados', 'tecnologia']
  },
  {
    id: 'rep_lgpd_seguranca',
    eixo: 'tecnologia_gestao',
    tipo: 'legislacao',
    titulo: 'Equilíbrio entre Tecnologia Policial, Transparência e Privacidade',
    fonte: 'LGPD (Lei nº 13.709/2018, art. 4º, III) · LAI (Lei nº 12.527/2011)',
    aspectoTipico: 'Ressalva / Limite jurídico',
    resumo:
      'Embora a LGPD ressalve atividades exclusivas de segurança pública para legislação específica, impõe-se governança de dados, auditoria e observância dos princípios de necessidade e proteção contra vieses no uso de novas tecnologias.',
    comoUsar:
      'Contudo, a incorporação de ferramentas de monitoramento e análise de dados na segurança pública deve ser acompanhada de protocolos de auditoria, transparência e respeito às garantias individuais, em harmonia com os princípios da proteção de dados.',
    palavrasChave: ['lgpd', 'privacidade', 'transparência', 'câmeras corporais', 'auditoria', 'ética digital']
  },
  {
    id: 'rep_evidencias_gestao',
    eixo: 'tecnologia_gestao',
    tipo: 'dado_oficial',
    titulo: 'Policiamento Orientado por Evidências e Mapeamento de Trechos Críticos',
    fonte: 'Gestão Estratégica de Segurança Viária · Boletins Estatísticos PRF',
    aspectoTipico: 'Estratégia operacional',
    resumo:
      'O cruzamento de séries históricas de sinistros (horário, dia da semana, causa presumível e quilômetro) permite concentrar equipes nos pontos de maior sinistralidade, maximizando vidas salvas por hora patrulhada.',
    comoUsar:
      'Por meio do policiamento orientado por evidências e do georreferenciamento de trechos críticos, torna-se possível direcionar o efetivo para os horários e pontos de maior incidência de sinistros, maximizando o impacto preventivo.',
    palavrasChave: ['evidências', 'georreferenciamento', 'estatística', 'trechos críticos', 'gestão']
  },

  // ================= MEIO AMBIENTE =================
  {
    id: 'rep_cf_225',
    eixo: 'meio_ambiente',
    tipo: 'legislacao',
    titulo: 'Meio Ambiente Ecologicamente Equilibrado como Direito Intergeracional',
    fonte: 'Art. 225 da Constituição Federal de 1988',
    aspectoTipico: 'Fundamentação constitucional',
    resumo:
      'Consagra o meio ambiente equilibrado como bem de uso comum do povo e essencial à sadia qualidade de vida, impondo ao Poder Público e à coletividade o dever de defendê-lo e preservá-lo.',
    comoUsar:
      'À luz do art. 225 da Constituição Federal, a defesa do meio ambiente ecologicamente equilibrado constitui dever compartilhado entre o Estado e a coletividade, o que confere relevância estratégica à fiscalização ambiental nas rodovias federais.',
    palavrasChave: ['art 225', 'meio ambiente', 'sustentabilidade', 'intergeracional', 'preservação']
  },
  {
    id: 'rep_crimes_ambientais',
    eixo: 'meio_ambiente',
    tipo: 'legislacao',
    titulo: 'Combate ao Tráfico de Fauna, Madeira e Minérios Ilegais',
    fonte: 'Lei de Crimes Ambientais (Lei nº 9.605/1998)',
    aspectoTipico: 'Atuação ambiental da PRF',
    resumo:
      'Tipifica sanções penais e administrativas contra lesões ao meio ambiente; as rodovias federais são rotas frequentes de escoamento de madeira ilegal, garimpo ilícito e animais silvestres traficados.',
    comoUsar:
      'Com base na Lei de Crimes Ambientais (Lei nº 9.605/1998), a fiscalização rodoviária integrada a órgãos como o IBAMA é instrumento indispensável para coibir o transporte clandestino de madeira, minérios e animais silvestres.',
    palavrasChave: ['crimes ambientais', 'fauna', 'madeira ilegal', 'ibama', 'desmatamento', 'lei 9605']
  },
  {
    id: 'rep_produtos_perigosos',
    eixo: 'meio_ambiente',
    tipo: 'politica_publica',
    titulo: 'Fiscalização de Produtos Perigosos e Prevenção de Desastres Ambientais',
    fonte: 'Resoluções ANTT · Decreto nº 96.044/1988',
    aspectoTipico: 'Prevenção de riscos',
    resumo:
      'Regulamenta sinalização, documentação, equipamentos de emergência e capacitação (curso MOPP) no transporte rodoviário de cargas perigosas, prevenindo contaminação de mananciais, solo e áreas urbanas.',
    comoUsar:
      'A fiscalização rigorosa do transporte rodoviário de produtos perigosos, conforme as normas da ANTT e a exigência de habilitação específica, previne acidentes de grande porte capazes de comprometer recursos hídricos e comunidades lindeiras.',
    palavrasChave: ['produtos perigosos', 'antt', 'mopp', 'desastre ambiental', 'cargas', 'mananciais']
  },
  {
    id: 'rep_arendt_cidadania',
    eixo: 'direitos_humanos',
    tipo: 'conceito_autor',
    titulo: 'Responsabilidade Coletiva e Espaço Público Democrático',
    fonte: 'Hannah Arendt — "A Condição Humana"',
    aspectoTipico: 'Contextualização / Espaço público',
    resumo:
      'A filosofia política de Arendt ressalta que o espaço público só se sustenta mediante responsabilidade compartilhada, respeito às leis comuns e reconhecimento da pluralidade dos cidadãos.',
    comoUsar:
      'Sob a perspectiva de que o espaço público exige corresponsabilidade cívica, o respeito às normas viárias e à convivência pacífica transcende a esfera individual, constituindo condição essencial para a proteção coletiva.',
    palavrasChave: ['espaço público', 'corresponsabilidade', 'cidadania', 'arendt', 'convivência']
  }
];

export const CEBRASPE_SKELETON = [
  {
    parte: 'Introdução (Opcional ou Curta)',
    linhas: '3 a 5 linhas',
    objetivo: 'Apresentar o tema com precisão e anunciar brevemente os aspectos exigidos no comando, sem rodeios.',
    dica: 'No Cebraspe, nunca desperdice 8 linhas com contextualização histórica genérica. Vá direto ao ponto central do tema.'
  },
  {
    parte: 'Desenvolvimento 1 — Aspecto 1 do comando',
    linhas: '7 a 8 linhas',
    objetivo: 'Responder integralmente ao primeiro tópico pedido pela banca com base legal/conceitual + explicação objetiva.',
    dica: 'Use palavras-chave do próprio comando no tópico frasal para facilitar a leitura do examinador.'
  },
  {
    parte: 'Desenvolvimento 2 — Aspecto 2 do comando',
    linhas: '7 a 8 linhas',
    objetivo: 'Aprofundar o segundo quesito com exemplo institucional concreto (atuação da PRF, SUSP, PNATRANS, dados ou lei).',
    dica: 'Evite repetir ideias do parágrafo anterior. Cada parágrafo deve fechar a pontuação máxima de um quesito do espelho.'
  },
  {
    parte: 'Desenvolvimento 3 / Fechamento — Aspecto 3',
    linhas: '7 a 9 linhas',
    objetivo: 'Responder ao último aspecto (frequentemente soluções, desafios ou papel do agente/Estado) e encerrar com frase-síntese.',
    dica: 'No Cebraspe, a conclusão separada NÃO é obrigatória se os 3 aspectos ocuparem bem as 30 linhas — mas fechar o último parágrafo com síntese dá acabamento elegante.'
  }
];

export const CEBRASPE_REGRAS_OURO = [
  'Responda a TODOS os aspectos na mesma ordem em que aparecem no comando da prova.',
  'Prefira frases curtas e diretas (ordem direta: sujeito + verbo + complemento) — isso reduz drasticamente erros de pontuação e concordância.',
  'O Cebraspe penaliza erros proporcionalmente ao total de linhas: escrever entre 27 e 30 linhas diminui o peso de cada erro na fórmula ND = NC − 2 × (NE / TL).',
  'Nunca crie título (a menos que a banca peça expressamente) e nunca invente números ou artigos de lei se não tiver certeza exata.'
];

export const CEBRASPE_CONECTIVOS = [
  {
    categoria: 'Abertura de aspecto (Tópico frasal)',
    itens: [
      'Em primeiro plano, cabe destacar que...',
      'Sob a ótica constitucional e legal, verifica-se que...',
      'No que tange à atuação institucional da PRF...',
      'Ademais, importa analisar os desafios relacionados a...'
    ]
  },
  {
    categoria: 'Fundamentação e exemplo',
    itens: [
      'Consoante dispõe o art. ... da Constituição Federal...',
      'A exemplo dessa diretriz, observa-se...',
      'Nesse sentido, a implementação de políticas como...',
      'Corrobora esse entendimento o disposto na Lei nº ...'
    ]
  },
  {
    categoria: 'Causa, consequência e contraste',
    itens: [
      'Em decorrência desse cenário, constata-se que...',
      'Por conseguinte, a ausência de fiscalização contínua resulta em...',
      'Entretanto, a efetividade dessas medidas ainda enfrenta entraves como...',
      'Embora o ordenamento jurídico preveja mecanismos rigorosos...'
    ]
  },
  {
    categoria: 'Proposta e fechamento objetivo',
    itens: [
      'Diante desse quadro, impõe-se fortalecer...',
      'Para mitigar tais vulnerabilidades, mostra-se indispensável...',
      'Portanto, a integração entre fiscalização, tecnologia e educação consolida...',
      'Desse modo, assegura-se a efetividade do interesse público e da segurança viária.'
    ]
  }
];
