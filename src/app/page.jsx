'use client';

import { useState, useEffect } from 'react';
import { apiClient, saveToken, getToken, clearToken } from '@/lib/api-client';

export default function Page() {
  const [activeTab, setActiveTab] = useState('apostadores');
  
  const [autenticado, setAutenticado] = useState(null);
  const [loginForm, setLoginForm] = useState({ usuario: '', senha: '' });
  const [loginErro, setLoginErro] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAutenticado(false);
      return;
    }
    
    apiClient('/auth/status')
      .then(d => setAutenticado(!!d.sessaoAtiva))
      .catch(() => {
        clearToken();
        setAutenticado(false);
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErro('');
    try {
      const payload = {
        usuario: loginForm.usuario,
        senha: loginForm.senha,
        credenciaisExternas: {
          apostas1:     { usuario: loginForm.usuario, senha: loginForm.senha },
          apostadores1: { usuario: loginForm.usuario, senha: loginForm.senha },
          lutas2:        { usuario: loginForm.usuario, senha: loginForm.senha },
        },
      };

      const d = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (!d.token) throw new Error('Token não retornado pelo servidor.');
      
      saveToken(d.token);
      setAutenticado(true);
    } catch (err) {
      setLoginErro(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    clearToken();
    setAutenticado(false);
  };

  if (autenticado === null) {
    return (
      <div className="login-wrapper">
        <div className="loading">Iniciando sistema...</div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <>
        <header className="main-header">
          <a href="#" className="header-logo">UFC<span>BET</span></a>
          <div className="header-auth">
            <span className="user-badge">Área Restrita</span>
          </div>
        </header>
        
        <div className="login-wrapper">
          <div className="login-card">
            <h2>Acesso Restrito</h2>
            <p className="login-desc">
              Painel Integrador de Estatísticas e Apostas UFC.
            </p>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Usuário</label>
                <input
                  required
                  autoFocus
                  placeholder="Seu usuário"
                  value={loginForm.usuario}
                  onChange={e => setLoginForm({...loginForm, usuario: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  required
                  placeholder="Sua senha"
                  value={loginForm.senha}
                  onChange={e => setLoginForm({...loginForm, senha: e.target.value})}
                />
              </div>
              {loginErro && <div className="login-erro">{loginErro}</div>}
              <button
                type="submit"
                className="btn btn-full"
                disabled={loginLoading}
              >
                {loginLoading ? 'AUTENTICANDO...' : 'ENTRAR'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="main-header">
        <a href="#" className="header-logo">UFC<span>BET</span></a>
        <div className="header-auth">
          <span className="user-badge">🟢 Online</span>
          <button className="btn danger" style={{marginLeft: '15px', padding: '5px 10px'}} onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-subtitle" style={{ fontSize: '2rem' }}>Jacarés no ladrilho</div>
          <h1 className="hero-title" style={{ fontSize: '6rem' }}>Zézinho vs Iguinho</h1>
        </div>
      </section>

      <div className="container">
        <div className="tabs">
          <button className={`tab ${activeTab === 'apostadores' ? 'active' : ''}`} onClick={() => setActiveTab('apostadores')}>Apostadores</button>
          <button className={`tab ${activeTab === 'lutadores' ? 'active' : ''}`} onClick={() => setActiveTab('lutadores')}>Lutadores</button>
          <button className={`tab ${activeTab === 'lutas' ? 'active' : ''}`} onClick={() => setActiveTab('lutas')}>Lutas</button>
          <button className={`tab ${activeTab === 'apostas' ? 'active' : ''}`} onClick={() => setActiveTab('apostas')}>Apostas</button>
        </div>

        <main>
          {activeTab === 'apostadores' && <ApostadoresPanel />}
          {activeTab === 'lutadores' && <LutadoresPanel />}
          {activeTab === 'lutas' && <LutasPanel />}
          {activeTab === 'apostas' && <ApostasPanel />}
        </main>
      </div>
    </>
  );
}

function ApostadoresPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nome: '', idade: '', chave_pix: '' });

  const loadData = () => {
    setLoading(true);
    apiClient('/apostadores')
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await apiClient('/apostadores', {
      method: 'POST',
      body: JSON.stringify({ ...formData, idade: Number(formData.idade) })
    });
    setModalOpen(false);
    setFormData({ nome: '', idade: '', chave_pix: '' });
    loadData();
  };

  const handleDelete = async (id, instancia) => {
    if(confirm('Tem certeza?')) {
      await apiClient(`/apostadores/${id}?instancia=${instancia || 1}`, { method: 'DELETE' });
      loadData();
    }
  };

  return (
    <div className="panel">
      <h2>Apostadores <button className="btn" onClick={() => setModalOpen(true)}>+ Novo</button></h2>
      {loading ? <div className="loading">Carregando...</div> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>ID</th><th>Nome</th><th>Idade</th><th>Chave PIX</th><th>Instância</th><th>Ações</th></tr></thead>
            <tbody>
              {data.map(item => (
                <tr key={`${item.id}-${item._instancia}`}>
                  <td>{item.id}</td>
                  <td>{item.nome}</td>
                  <td>{item.idade}</td>
                  <td>{item.chave_pix || item.chavePix}</td>
                  <td>I{item._instancia}</td>
                  <td className="actions">
                    <button className="btn danger" onClick={() => handleDelete(item.id, item._instancia)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={6} style={{textAlign: 'center'}}>Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Novo Apostador</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nome</label>
                <input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Idade</label>
                <input type="number" required value={formData.idade} onChange={e => setFormData({...formData, idade: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Chave PIX</label>
                <input required value={formData.chave_pix} onChange={e => setFormData({...formData, chave_pix: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LutadoresPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nome: '', apelido: '', peso: '', categoria: '1', arte: '1' });

  const loadData = () => {
    setLoading(true);
    setErro('');
    apiClient('/lutadores')
      .then(d => {
        if (d && d.error) { setErro(d.error); setData([]); }
        else { setData(Array.isArray(d) ? d : []); }
        setLoading(false);
      })
      .catch(e => { setErro(e.message); setLoading(false); });
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await apiClient('/lutadores', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        peso: formData.peso ? Number(formData.peso) : 80.0
      })
    });
    setModalOpen(false);
    setFormData({ nome: '', apelido: '', peso: '', categoria: '1', arte: '1' });
    loadData();
  };

  const handleDelete = async (id, instancia) => {
    if(confirm('Tem certeza?')) {
      await apiClient(`/lutadores/${id}?instancia=${instancia || 1}`, { method: 'DELETE' });
      loadData();
    }
  };

  return (
    <div className="panel">
      <h2>Lutadores <button className="btn" onClick={() => setModalOpen(true)}>+ Novo</button></h2>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : erro ? (
        <div className="api-erro">
          <div className="api-erro-icon">⚠️</div>
          <p><strong>Erro ao conectar com a API</strong></p>
          <p className="api-erro-msg">{erro}</p>
          <button className="btn" onClick={loadData}>↻ Tentar novamente</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>ID</th><th>Nome</th><th>Apelido / Peso</th><th>Categoria</th><th>Arte</th><th>Instância</th><th>Ações</th></tr></thead>
            <tbody>
              {data.map(item => (
                <tr key={`${item.id}-${item._instancia}`}>
                  <td>{item.id}</td>
                  <td>{item.nome}</td>
                  <td>{item.apelido || `${item.peso}kg`}</td>
                  <td>{item.categoria}</td>
                  <td>{item.arte || '-'}</td>
                  <td>I{item._instancia}</td>
                  <td className="actions">
                    <button className="btn danger" onClick={() => handleDelete(item.id, item._instancia)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={7} style={{textAlign: 'center'}}>Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Novo Lutador</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nome</label>
                <input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Apelido (I2)</label>
                <input value={formData.apelido} onChange={e => setFormData({...formData, apelido: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Peso em Kg (I1)</label>
                <input type="number" step="0.1" value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Categoria (1,2,3 ou Texto)</label>
                <input required value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Arte Marcial (I2)</label>
                <select value={formData.arte} onChange={e => setFormData({...formData, arte: e.target.value})}>
                  <option value="1">Boxe</option>
                  <option value="2">Karatê</option>
                  <option value="3">Muay Thai</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LutasPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ horario: '20:00:00', data: '2025-06-15', lutador1: '', lutador2: '' });

  const loadData = () => {
    setLoading(true);
    apiClient('/lutas')
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await apiClient('/lutas', {
      method: 'POST',
      body: JSON.stringify({ ...formData, lutador1: Number(formData.lutador1), lutador2: Number(formData.lutador2) })
    });
    setModalOpen(false);
    setFormData({ horario: '20:00:00', data: '2025-06-15', lutador1: '', lutador2: '' });
    loadData();
  };

  const handleDelete = async (id, instancia) => {
    if(confirm('Tem certeza?')) {
      await apiClient(`/lutas/${id}?instancia=${instancia || 1}`, { method: 'DELETE' });
      loadData();
    }
  };

  return (
    <div className="panel">
      <h2>Lutas <button className="btn" onClick={() => setModalOpen(true)}>+ Nova</button></h2>
      {loading ? <div className="loading">Carregando...</div> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>ID</th><th>Data</th><th>Horário</th><th>Lutador 1</th><th>Lutador 2</th><th>Instância</th><th>Ações</th></tr></thead>
            <tbody>
              {data.map(item => (
                <tr key={`${item.id}-${item._instancia}`}>
                  <td>{item.id}</td>
                  <td>{item.data}</td>
                  <td>{item.horario}</td>
                  <td>ID: {item.lutador1}</td>
                  <td>ID: {item.lutador2}</td>
                  <td>I{item._instancia}</td>
                  <td className="actions">
                    <button className="btn danger" onClick={() => handleDelete(item.id, item._instancia)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={7} style={{textAlign: 'center'}}>Nenhuma luta encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Nova Luta</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Data</label>
                <input type="date" required value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Horário</label>
                <input type="time" required value={formData.horario} onChange={e => setFormData({...formData, horario: e.target.value})} step="1" />
              </div>
              <div className="form-group">
                <label>ID Lutador 1</label>
                <input type="number" required value={formData.lutador1} onChange={e => setFormData({...formData, lutador1: e.target.value})} />
              </div>
              <div className="form-group">
                <label>ID Lutador 2</label>
                <input type="number" required value={formData.lutador2} onChange={e => setFormData({...formData, lutador2: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ApostasPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ valor: '', id_luta: '', id_lutador: '', id_apostador: '' });

  const loadData = () => {
    setLoading(true);
    apiClient('/apostas')
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await apiClient('/apostas', {
      method: 'POST',
      body: JSON.stringify({ 
        valor: Number(formData.valor), 
        id_luta: Number(formData.id_luta), 
        id_lutador: Number(formData.id_lutador), 
        id_apostador: Number(formData.id_apostador) 
      })
    });
    setModalOpen(false);
    setFormData({ valor: '', id_luta: '', id_lutador: '', id_apostador: '' });
    loadData();
  };

  const handleDelete = async (id, instancia) => {
    if(confirm('Tem certeza?')) {
      await apiClient(`/apostas/${id}?instancia=${instancia || 1}`, { method: 'DELETE' });
      loadData();
    }
  };

  return (
    <div className="panel">
      <h2>Apostas <button className="btn" onClick={() => setModalOpen(true)}>+ Nova</button></h2>
      {loading ? <div className="loading">Carregando...</div> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>ID</th><th>Valor</th><th>Apostador</th><th>Luta</th><th>Lutador</th><th>Instância</th><th>Ações</th></tr></thead>
            <tbody>
              {data.map(item => (
                <tr key={`${item.id}-${item._instancia}`}>
                  <td>{item.id}</td>
                  <td>R$ {item.valor}</td>
                  <td>ID: {item.id_apostador || '-'}</td>
                  <td>ID: {item.id_luta}</td>
                  <td>ID: {item.id_lutador || '-'}</td>
                  <td>I{item._instancia}</td>
                  <td className="actions">
                    <button className="btn danger" onClick={() => handleDelete(item.id, item._instancia)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={7} style={{textAlign: 'center'}}>Nenhuma aposta encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Nova Aposta</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input type="number" step="0.01" required value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} />
              </div>
              <div className="form-group">
                <label>ID Apostador</label>
                <input type="number" required value={formData.id_apostador} onChange={e => setFormData({...formData, id_apostador: e.target.value})} />
              </div>
              <div className="form-group">
                <label>ID Luta</label>
                <input type="number" required value={formData.id_luta} onChange={e => setFormData({...formData, id_luta: e.target.value})} />
              </div>
              <div className="form-group">
                <label>ID Lutador Escolhido</label>
                <input type="number" required value={formData.id_lutador} onChange={e => setFormData({...formData, id_lutador: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
