// estoque-app/js/api.js

import { API_URL } from './config.js';

export async function apiGetTecnicos() {
  try {
    const response = await fetch(`${API_URL}?action=getTecnicos`);
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar técnicos:', error);
    return { success: false, error: error.message };
  }
}

export async function apiGetEstoque() {
  try {
    const response = await fetch(`${API_URL}?action=getEstoque`);
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    return { success: false, error: error.message };
  }
}

export async function apiRegistrarRetirada(data) {
  console.log('📤 Enviando retirada:', data);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Erro ao registrar retirada:', error);
    return { success: false, error: error.message };
  }
}