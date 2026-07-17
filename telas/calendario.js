import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chave usada para salvar os eventos no AsyncStorage, essa chave funciona como um identificador.
const CHAVE_EVENTOS = '@CuidaMais:calendarioEventos';

// Configurando o calendário para Português
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// Eventos iniciais, usados apenas se ainda não houver nada salvo
const EVENTOS_INICIAIS = [
  { id: 1, titulo: 'Consulta pré-natal', dataCompleta: '2026-06-11', hora: '10:00', tipo: 'consulta', status: 'pendente' },
  { id: 2, titulo: 'Vacina dTpa',      dataCompleta: '2026-06-24', hora: '14:30', tipo: 'vacina',   status: 'pendente' },
];

// Função que representa a tela do calendario, retorna toda interface dessa tela
// Aqui useState organiza os estados dos eventos. OBS::: MESMO USANDO USESTATE PARA ORGANIZAR AS TELAS E OS EVENTOS, O REACT IDENTIFICA QUE CADA COMPONENTE TEM SEUS ESTADOS SEPARADOS E MANTEM ELES ASSIM. ENTÃO RELAXA QUE NÃO VAI DAR ERRO!! 🫶🫶
export default function Calendario() {
  const [mesAnoAtual, setMesAnoAtual] = useState('Junho 2026');    
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true); // Controla se os dados ainda estão sendo carregados ou não.
  const [modalVisivel, setModalVisivel] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaHora, setNovaHora] = useState('');
  const [novoTipo, setNovoTipo] = useState('consulta');

  // Carrega os eventos salvos assim que a tela abre
  useEffect(() => {
    const carregarEventos = async () => {
      try {
        const eventosSalvos = await AsyncStorage.getItem(CHAVE_EVENTOS);
        if (eventosSalvos) {
          setEventos(JSON.parse(eventosSalvos));
        } else {
          setEventos(EVENTOS_INICIAIS);
          await AsyncStorage.setItem(CHAVE_EVENTOS, JSON.stringify(EVENTOS_INICIAIS));
        }
      } catch (erro) {
        console.log('Erro ao carregar eventos:', erro);
        setEventos(EVENTOS_INICIAIS);
      } finally {
        setCarregando(false);
      }
    };
    carregarEventos();
  }, []);

  // Salva os eventos no AsyncStorage sempre que eles mudam
  const salvarEventos = async (novosEventos) => {
    setEventos(novosEventos);
    try {
      await AsyncStorage.setItem(CHAVE_EVENTOS, JSON.stringify(novosEventos));
    } catch (erro) {
      console.log('Erro ao salvar eventos:', erro);
    }
  };

  const atualizarStatusEvento = (id, novoStatus) => {
    const eventosAtualizados = eventos.map(evento =>
      evento.id === id ? { ...evento, status: novoStatus } : evento
    );
    salvarEventos(eventosAtualizados);
  };

// Aqui o Modal serve para quando a usuária clicar em uma data do calendario para cadastrar um novo evento 
  const abrirModalNovoEvento = (dia) => {
    setDiaSelecionado(dia.dateString);
    setNovoTitulo('');
    setNovaHora('');
    setNovoTipo('consulta');
    setModalVisivel(true);
  };

  const salvarNovoEvento = () => {
    if (!novoTitulo.trim() || !diaSelecionado) {
      return;
    }
    const novoEvento = { // Aqui criei um objeto para reunir todas as infomações necessárias sobre o eventoantes de salvar.
      id: Date.now(), // Aqui, evito que dois eventos tenham o mesmo ID
      titulo: novoTitulo.trim(),
      dataCompleta: diaSelecionado,
      hora: novaHora.trim() || '--:--',
      tipo: novoTipo,
      status: 'pendente'
    };
    salvarEventos([...eventos, novoEvento]);
    setModalVisivel(false);
  };

  const renderAcoesEsquerda = (id) => (
    <TouchableOpacity
      style={[styles.acaoSwipe, styles.acaoConcluido]} // Swipeable: lip usada para gestos de "arrastar"
      onPress={() => atualizarStatusEvento(id, 'concluido')}
    >
      <Text style={styles.acaoTexto}>Concluído</Text>
    </TouchableOpacity> // Detalhe curioso que pode confundir, TouchableOpacity não é um botão, ele torna uma área clicável.
  );

  const renderAcoesDireita = (id) => ( 
    <TouchableOpacity
      style={[styles.acaoSwipe, styles.acaoNaoConcluido]}
      onPress={() => atualizarStatusEvento(id, 'nao_concluido')}
    >
      <Text style={styles.acaoTexto}>Não concluído</Text>
    </TouchableOpacity>
  );

  // Separar responsabilidades
  // Prepara as informações que o calendário precisa, analisa os eventos já cadastrados e gera os indicadores de cada data.
  const gerarMarcacoes = () => {
    const markers = {};
    
    eventos.forEach(evento => { // Percorre cada evento 
      if (evento.tipo === 'consulta') {
        markers[evento.dataCompleta] = {
          marked: true,
          dotColor: '#85B7EB',
          customStyles: {
            container: { borderBottomWidth: 2, borderBottomColor: '#85B7EB', borderRadius: 0 }
          }
        };
      } else if (evento.tipo === 'vacina') {
        markers[evento.dataCompleta] = {
          marked: true,
          dotColor: '#FAC775',
          customStyles: {
            container: { borderBottomWidth: 2, borderBottomColor: '#FAC775', borderRadius: 0 }
          }
        };
      }
    });

    return markers;
  };

  const formatarDataAmigavel = (dataString) => { // Converte a data para um formato amigável ao usuário, 
    try { // Me ajuda a garantir que se acontecer algum erro, a aplicação continue funcionando retornando a data original
      const dataObjeto = parseISO(dataString);
      return format(dataObjeto, "dd 'de' MMM", { locale: ptBR });
    } catch (e) {
      return dataString;
    }
  };

  if (carregando) {
    return (
      <View style={styles.carregandoContainer}>
        <Text style={styles.carregandoTexto}>Carregando calendário...</Text>
      </View>
    );
  }

  return (
    // Garante que os gestos funcionem corretamente: obs.: "GestureHandlerRootView" é o container obrigatório quando usamos a biblioteca react-native-gesture-handler 🤭
    <GestureHandlerRootView style={{ flex: 1 }}> 
    <ScrollView contentContainerStyle={styles.container}> // Esse camarada aqui permite que o conteúdo seja deslizado verticalmente. Ótimo para telas com muita informação 😏
      <View style={styles.header}>
        <Text style={styles.greeting}>Seu acompanhamento 📅</Text>
        <Text style={styles.title}>Meu Calendário</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{mesAnoAtual}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* COMPONENTE DO CALENDÁRIO */}
        <Calendar
          current={'2026-06-22'}
          markingType={'custom'}
          markedDates={gerarMarcacoes()}
          onDayPress={abrirModalNovoEvento}
          onMonthChange={(month) => {
            const nomeMes = LocaleConfig.locales['pt-br'].monthNames[month.month - 1];
            setMesAnoAtual(`${nomeMes} ${month.year}`);
          }}
          theme={{
            backgroundColor: '#fff',
            calendarBackground: '#fff',
            textSectionTitleColor: '#c0496a',
            selectedDayBackgroundColor: '#FFB6C8',
            selectedDayTextColor: '#7a2840',
            todayTextColor: '#7a2840',
            todayBackgroundColor: '#FFB6C8',
            dayTextColor: '#555',
            textDisabledColor: '#ccc',
            arrowColor: '#c0496a',
            monthTextColor: '#7a2840',
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: 'bold',
            textDayFontSize: 12,
            textMonthFontSize: 15,
            textDayHeaderFontSize: 10,
          }}
        />

        {/* LEGENDA */}
        <View style={styles.legenda}>
          <View style={styles.legItem}>
            <View style={[styles.legDot, { backgroundColor: '#85B7EB' }]} />
            <Text style={styles.legText}>Consulta</Text>
          </View>
          <View style={styles.legItem}>
            <View style={[styles.legDot, { backgroundColor: '#FAC775' }]} />
            <Text style={styles.legText}>Vacina</Text>
          </View>
        </View>

        {/* PRÓXIMOS EVENTOS */}
        <Text style={styles.sectionLabel}>PRÓXIMOS EVENTOS</Text>
        {eventos.map(evento => ( // Lista de eventos com Swipeable para ações: Esse colega nos permite arrastar para os lados e mostrar ações.
          <Swipeable
            key={evento.id} 
            renderLeftActions={() => renderAcoesEsquerda(evento.id)}
            renderRightActions={() => renderAcoesDireita(evento.id)}
          >
          <View style={[ // Estilos condicionais para os cartões mudarem conforme o estado "concluído ou não concluído."
            styles.eventoCard,
            evento.status === 'concluido' && styles.eventoCardConcluido,
            evento.status === 'nao_concluido' && styles.eventoCardNaoConcluido
          ]}>
            <View style={[styles.eventoDot, evento.tipo === 'consulta' ? styles.dotConsulta : styles.dotVacina]} />
            <View>
              <Text style={styles.eventoTitulo}>{evento.titulo}</Text>
              <Text style={styles.eventoData}>
                {formatarDataAmigavel(evento.dataCompleta)} · {evento.hora}
              </Text>
              <Text style={styles.eventoStatus}>{evento.status}</Text>
            </View>
          </View>
          </Swipeable>
        ))}
      </View>
    </ScrollView>

    <Modal visible={modalVisivel} transparent animationType="slide">
      <View style={styles.modalFundo}>
        <View style={styles.modalCaixa}>
          <Text style={styles.modalTitulo}>Novo evento</Text>
          <Text style={styles.modalData}>{diaSelecionado}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Título do evento"
            value={novoTitulo}
            onChangeText={setNovoTitulo}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Hora (ex: 09:30)"
            value={novaHora}
            onChangeText={setNovaHora}
          />
          <View style={styles.modalTipoLinha}>
            <TouchableOpacity
              style={[styles.modalTipoBotao, novoTipo === 'consulta' && styles.modalTipoBotaoAtivo]}
              onPress={() => setNovoTipo('consulta')}
            >
              <Text>Consulta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalTipoBotao, novoTipo === 'vacina' && styles.modalTipoBotaoAtivo]}
              onPress={() => setNovoTipo('vacina')}
            >
              <Text>Vacina</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBotoesLinha}>
            <TouchableOpacity style={styles.modalBotaoCancelar} onPress={() => setModalVisivel(false)}>
              <Text>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBotaoSalvar} onPress={salvarNovoEvento}>
              <Text style={{ color: '#fff' }}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  carregandoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff8fb', 
  },
  carregandoTexto: {
    color: '#aa7078', 
    fontSize: 14,
  },
  container: { 
    flexGrow: 1, 
    backgroundColor: '#fff8fb' 
    },
  header: {
    backgroundColor: '#FFB6C8', 
    padding: 24, 
    paddingTop: 48 
    },
  greeting: { 
    fontSize: 13, 
    color: '#99435a' 
    },
  title: { 
    fontSize: 22,
    fontWeight: 'bold', 
    color: '#7a2840', 
    marginTop: 2 
    },
  badge: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#fff0f4', 
    borderRadius: 20, 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    marginTop: 8 }
    ,
  badgeText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#c0496a' 
    },
  body: { 
    padding: 16 
    },

  legenda: { 
    flexDirection: 'row', 
    gap: 16, 
    marginTop: 15, 
    marginBottom: 20 
    },
  legItem: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 5 
    },
  legDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4 
    },
  legText: { 
    fontSize: 11, 
    color: '#888' 
    },
  sectionLabel: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#c0496a', 
    letterSpacing: 1, 
    marginBottom: 10 
    },
  eventoCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#fcd0dc', 
    borderRadius: 10, 
    padding: 10, 
    marginBottom: 8 
    },
  eventoCardConcluido: {
    borderColor: '#8BC98B',
    backgroundColor: '#f1faf1'
  },
  eventoCardNaoConcluido: {
    borderColor: '#E08A8A',
    backgroundColor: '#fdf1f1'
  },
  eventoDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5 
    },
  dotConsulta: { 
    backgroundColor: '#85B7EB' 
    },
  dotVacina:   { 
    backgroundColor: '#FAC775' 
    },
  eventoTitulo: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#444' 
    },
  eventoData: { 
    fontSize: 11, 
    color: '#999', 
    marginTop: 1 
    },
  eventoStatus: {
    fontSize: 10,
    color: '#bbb',
    marginTop: 1,
    fontStyle: 'italic'
  },
  acaoSwipe: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginBottom: 8,
    borderRadius: 10
  },
  acaoConcluido: {
    backgroundColor: '#8BC98B'
  },
  acaoNaoConcluido: {
    backgroundColor: '#E08A8A'
  },
  acaoTexto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 6
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end'
  },
  modalCaixa: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7a2840'
  },
  modalData: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#fcd0dc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10
  },
  modalTipoLinha: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  modalTipoBotao: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  modalTipoBotaoAtivo: {
    backgroundColor: '#FFB6C8',
    borderColor: '#FFB6C8'
  },
  modalBotoesLinha: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  modalBotaoCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  modalBotaoSalvar: {
    backgroundColor: '#c0496a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8
  }
});
