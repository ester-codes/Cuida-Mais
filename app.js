import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';

// Importando todas as telas
import WelcomeScreen from './telas/index'; 
import LoginScreen from './telas/login'; 
import Sintomas from './telas/sintomas';
import Calendario from './telas/calendario';
import Comunidade from './telas/comunidade';

export default function App() {
  const [telaAtual, setTelaAtual] = useState('Welcome');  // Garante que sempre inicie na tela de boas vindas

  const navigation = {
    navigate: (nomeDaTela) => setTelaAtual(nomeDaTela), //  Otimiza o fluxo de navegação entre telas, useState funciona como um "organizador"
    replace: (nomeDaTela) => setTelaAtual(nomeDaTela === 'Tabs' ? 'calendario' : nomeDaTela),
    goBack: () => setTelaAtual('Welcome'), 
  };

  // Nota: usei useState ao invés de uma variável comum, porque a variável poderia facilmente mudar de valor, o useState garante um estado organizado pelo React.

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.conteudoPrincipal}>
        {telaAtual === 'Welcome' && <WelcomeScreen navigation={navigation} />}   
        {telaAtual === 'login' && <LoginScreen navigation={navigation} />}
        {telaAtual === 'calendario' && <Calendario navigation={navigation} />}
        {telaAtual === 'sintomas' && <Sintomas navigation={navigation} />}
        {telaAtual === 'comunidade' && <Comunidade navigation={navigation} />}
      </View> 

      {(telaAtual === 'calendario' || telaAtual === 'sintomas' || telaAtual === 'comunidade') && (
        <View style={styles.tabBar}>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setTelaAtual('calendario')}
          >
            <Text style={[
              styles.tabTexto,
              telaAtual === 'calendario' ? styles.tabAtivo : styles.tabInativo
            ]}>
              📅 Calendário
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setTelaAtual('sintomas')}
          >
            <Text style={[
              styles.tabTexto,
              telaAtual === 'sintomas' ? styles.tabAtivo : styles.tabInativo
            ]}>
              🤒 Sintomas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setTelaAtual('comunidade')}
          >
            <Text style={[
              styles.tabTexto,
              telaAtual === 'comunidade' ? styles.tabAtivo : styles.tabInativo
            ]}>
              💬 Comunidade
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupa todo espaço disponível
    backgroundColor: '#fff',
  },
  conteudoPrincipal: {
    flex: 1,
  },
  tabBar: { // Barra inferior de navegação:::
    flexDirection: 'row', // Organiza os itens em linhas!!!!
    height: 60, 
    backgroundColor: '#fff', 
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 5,
  },
  tabItem: { // Cada item da barra de navegação:: 
    flex: 1, // Cada item ocupa o mesmo espaço 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  tabTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabAtivo: {
    color: '#cc4b4b',
  },
  tabInativo: {
    color: '#888',
  },
});
