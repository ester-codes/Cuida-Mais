import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,TextInput, KeyboardAvoidingView, Platform,}

from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves usadas no AsyncStorage
const CHAVE_IDENTIDADE = '@CuidaMais:identidadeAnonima';
const CHAVE_POSTS = '@CuidaMais:comunidadePosts';

// Bancos de nomes e emojis para gerar a identidade anônima
const NOMES_ANONIMOS = [
  'Nuvem Rosa', 'Estrelinha Guerreira', 'Borboleta Azul', 'Girassol Feliz',
  'Lua Serena', 'Flor de Maio', 'Pipoca Doce', 'Arco-íris Manso',
  'Ninho Quentinho', 'Brisa Leve', 'Passarinho Livre', 'Cerejeira Rosa',
];
const EMOJIS_ANONIMOS = ['🌸', '🦋', '🌙', '⭐️', '🌷', '🐝', '🍃', '🌼', '🫧', '🌈', '🍀', '🌺'];

const POSTS_INICIAIS = [
  {
    id: 1,
    nome: 'Nuvem Rosa',
    emoji: '🌙',
    texto: 'Meninas, hoje senti o bebê mexer bastante à noite, isso é normal? Fiquei meio ansiosa 💗',
    curtidas: 4,
    curtido: false,
    respostas: [
      { id: 1, nome: 'Girassol Feliz', emoji: '🌼', texto: 'Super normal! À noite costuma ser quando eles mais mexem, comigo também é assim 😊' },
    ],
  },
  {
    id: 2,
    nome: 'Borboleta Azul',
    emoji: '🦋',
    texto: 'Alguém mais com muita azia nessa fase? O que tem ajudado vocês?',
    curtidas: 7,
    curtido: false,
    respostas: [],
  },
];

// Sorteia uma identidade anônima nova
const gerarIdentidade = () => {
  const nome = NOMES_ANONIMOS[Math.floor(Math.random() * NOMES_ANONIMOS.length)];
  const emoji = EMOJIS_ANONIMOS[Math.floor(Math.random() * EMOJIS_ANONIMOS.length)];
  return { nome, emoji };
};

export default function Comunidade() {
  const [identidade, setIdentidade] = useState(null);
  const [posts, setPosts] = useState([]);
  const [textoNovoPost, setTextoNovoPost] = useState('');
  const [postAbertoId, setPostAbertoId] = useState(null);
  const [textoResposta, setTextoResposta] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Carrega identidade anônima e posts salvos ao abrir a tela
  useEffect(() => {
    const carregarDados = async () => {
      try {
        let identidadeSalva = await AsyncStorage.getItem(CHAVE_IDENTIDADE);
        if (!identidadeSalva) {
          const novaIdentidade = gerarIdentidade();
          await AsyncStorage.setItem(CHAVE_IDENTIDADE, JSON.stringify(novaIdentidade));
          identidadeSalva = JSON.stringify(novaIdentidade);
        }
        setIdentidade(JSON.parse(identidadeSalva));

        const postsSalvos = await AsyncStorage.getItem(CHAVE_POSTS);
        if (postsSalvos) {
          setPosts(JSON.parse(postsSalvos));
        } else {
          setPosts(POSTS_INICIAIS);
          await AsyncStorage.setItem(CHAVE_POSTS, JSON.stringify(POSTS_INICIAIS));
        }
      } catch (erro) {
        console.log('Erro ao carregar dados da comunidade:', erro);
        setPosts(POSTS_INICIAIS);
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, []);

  // Salva posts no AsyncStorage sempre que eles mudam
  const salvarPosts = async (novosPosts) => {
    setPosts(novosPosts);
    try {
      await AsyncStorage.setItem(CHAVE_POSTS, JSON.stringify(novosPosts));
    } catch (erro) {
      console.log('Erro ao salvar posts:', erro);
    }
  };

  const publicarPost = () => {
    if (!textoNovoPost.trim() || !identidade) return;

    const novoPost = {
      id: Date.now(),
      nome: identidade.nome,
      emoji: identidade.emoji,
      texto: textoNovoPost.trim(),
      curtidas: 0,
      curtido: false,
      respostas: [],
    };

    salvarPosts([novoPost, ...posts]);
    setTextoNovoPost('');
  };

  const alternarCurtida = (id) => {
    const atualizados = posts.map((post) =>
      post.id === id
        ? {
            ...post,
            curtido: !post.curtido,
            curtidas: post.curtido ? post.curtidas - 1 : post.curtidas + 1,
          }
        : post
    );
    salvarPosts(atualizados);
  };

  const alternarRespostas = (id) => {
    setPostAbertoId(postAbertoId === id ? null : id);
    setTextoResposta('');
  };

  const enviarResposta = (id) => {
    if (!textoResposta.trim() || !identidade) return;

    const novaResposta = {
      id: Date.now(),
      nome: identidade.nome,
      emoji: identidade.emoji,
      texto: textoResposta.trim(),
    };

    const atualizados = posts.map((post) =>
      post.id === id
        ? { ...post, respostas: [...post.respostas, novaResposta] }
        : post
    );
    salvarPosts(atualizados);
    setTextoResposta('');
  };

  if (carregando) {
    return (
      <View style={styles.carregandoContainer}>
        <Text style={styles.carregandoTexto}>Carregando comunidade...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Um espaço só nosso 💗</Text>
          <Text style={styles.title}>Comunidade</Text>
          {identidade && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Você aqui é: {identidade.emoji} {identidade.nome}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* CAIXA DE NOVO POST */}
          <View style={styles.novoPostCaixa}>
            <TextInput
              style={styles.novoPostInput}
              placeholder="Compartilhe algo com outras mamães..."
              placeholderTextColor="#aa7078"
              value={textoNovoPost}
              onChangeText={setTextoNovoPost}
              multiline
            />
            <TouchableOpacity style={styles.botaoPublicar} onPress={publicarPost}>
              <Text style={styles.botaoPublicarTexto}>Publicar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>FEED</Text>

          {/* LISTA DE POSTS */}
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postCabecalho}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>{post.emoji}</Text>
                </View>
                <Text style={styles.postNome}>{post.nome}</Text>
              </View>

              <Text style={styles.postTexto}>{post.texto}</Text>

              <View style={styles.postAcoes}>
                <TouchableOpacity
                  style={styles.acaoBotao}
                  onPress={() => alternarCurtida(post.id)}
                >
                  <Text style={[styles.acaoTexto, post.curtido && styles.acaoTextoAtivo]}>
                    {post.curtido ? '💗' : '🤍'} {post.curtidas}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acaoBotao}
                  onPress={() => alternarRespostas(post.id)}
                >
                  <Text style={styles.acaoTexto}>
                    💬 {post.respostas.length} {post.respostas.length === 1 ? 'resposta' : 'respostas'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* RESPOSTAS (expande ao tocar em "responder") */}
              {postAbertoId === post.id && (
                <View style={styles.respostasArea}>
                  {post.respostas.map((resposta) => (
                    <View key={resposta.id} style={styles.respostaItem}>
                      <Text style={styles.respostaEmoji}>{resposta.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.respostaNome}>{resposta.nome}</Text>
                        <Text style={styles.respostaTexto}>{resposta.texto}</Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.respostaInputLinha}>
                    <TextInput
                      style={styles.respostaInput}
                      placeholder="Escrever uma resposta..."
                      placeholderTextColor="#aa7078"
                      value={textoResposta}
                      onChangeText={setTextoResposta}
                    />
                    <TouchableOpacity onPress={() => enviarResposta(post.id)}>
                      <Text style={styles.respostaEnviar}>Enviar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: '#fff8fb',
  },
  header: {
    backgroundColor: '#FFB6C8',
    padding: 24,
    paddingTop: 48,
  },
  greeting: {
    fontSize: 13,
    color: '#99435a',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7a2840',
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff0f4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c0496a',
  },
  body: {
    padding: 16,
  },
  novoPostCaixa: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fcd0dc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  novoPostInput: {
    minHeight: 50,
    fontSize: 14,
    color: '#554044',
    textAlignVertical: 'top',
  },
  botaoPublicar: {
    alignSelf: 'flex-end',
    backgroundColor: '#c0496a',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 8,
  },
  botaoPublicarTexto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#c0496a',
    letterSpacing: 1,
    marginBottom: 10,
  },
  postCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fcd0dc',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  postCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  postNome: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7a2840',
  },
  postTexto: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 10,
  },
  postAcoes: {
    flexDirection: 'row',
    gap: 20,
  },
  acaoBotao: {
    paddingVertical: 4,
  },
  acaoTexto: {
    fontSize: 12,
    color: '#999',
  },
  acaoTextoAtivo: {
    color: '#c0496a',
    fontWeight: '600',
  },
  respostasArea: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#fcd0dc',
  },
  respostaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  respostaEmoji: {
    fontSize: 14,
    marginTop: 2,
  },
  respostaNome: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7a2840',
  },
  respostaTexto: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  respostaInputLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  respostaInput: {
    flex: 1,
    backgroundColor: '#FFF8F9',
    borderWidth: 1,
    borderColor: '#FFE0E4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#554044',
  },
  respostaEnviar: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c0496a',
  },
});
