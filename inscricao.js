// ========================================
// INSCRIÇÃO PAGE - JAVASCRIPT
// ========================================

// ========================================
// ACCORDION FUNCTIONALITY
// ========================================
class Accordion {
  constructor(container) {
    this.container = container;
    this.headers = container.querySelectorAll('.accordion-header');
    this.contents = container.querySelectorAll('.accordion-content');
    
    this.init();
  }
  
  init() {
    this.headers.forEach((header, index) => {
      header.addEventListener('click', () => {
        this.toggle(index);
      });
      
      // Keyboard accessibility
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle(index);
        }
      });
    });
    
    // Abrir primeiro item por padrão (opcional)
    // this.open(0);
  }
  
  toggle(index) {
    const header = this.headers[index];
    const content = this.contents[index];
    const isOpen = header.classList.contains('active');
    
    if (isOpen) {
      this.close(index);
    } else {
      // Opcional: fechar outros itens ao abrir um novo
      // this.closeAll();
      this.open(index);
    }
  }
  
  open(index) {
    const header = this.headers[index];
    const content = this.contents[index];
    
    header.classList.add('active');
    header.setAttribute('aria-expanded', 'true');
    content.classList.add('active');
    
    // Calcular altura real do conteúdo para animação suave
    const contentHeight = content.scrollHeight;
    content.style.maxHeight = contentHeight + 'px';
  }
  
  close(index) {
    const header = this.headers[index];
    const content = this.contents[index];
    
    header.classList.remove('active');
    header.setAttribute('aria-expanded', 'false');
    content.classList.remove('active');
    content.style.maxHeight = '0';
  }
  
  closeAll() {
    this.headers.forEach((_, index) => {
      this.close(index);
    });
  }
  
  openAll() {
    this.headers.forEach((_, index) => {
      this.open(index);
    });
  }
}

// ========================================
// PRICING CARD INTERACTIONS
// ========================================
class PricingCards {
  constructor() {
    this.cards = document.querySelectorAll('.pricing-card');
    this.init();
  }
  
  init() {
    this.cards.forEach(card => {
      // Adicionar interação de clique para mobile
      card.addEventListener('click', (e) => {
        // Não fazer nada se clicou no botão
        if (e.target.classList.contains('pricing-btn')) return;
        
        // Mobile: destacar card selecionado
        if (window.innerWidth <= 768) {
          this.cards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
        }
      });
      
      // Tracking de cliques nos botões
      const btn = card.querySelector('.pricing-btn');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          
          const planName = card.querySelector('.pricing-title').textContent;
          const planPrice = card.querySelector('.amount').textContent;
          
          this.handleInscricao(planName, planPrice);
        });
      }
    });
  }
  
  handleInscricao(planName, planPrice) {
    // Aqui você pode:
    // 1. Redirecionar para página de checkout
    // 2. Abrir modal de inscrição
    // 3. Enviar para sistema externo
    
    console.log(`Inscrição iniciada: ${planName} - R$ ${planPrice}`);
    
    // Exemplo: redirecionar para página de checkout
    // window.location.href = `/checkout?plan=${encodeURIComponent(planName)}&price=${planPrice}`;
    
    // Exemplo: mostrar confirmação
    this.showConfirmation(planName, planPrice);
  }
  
  showConfirmation(planName, planPrice) {
    // Criar modal de confirmação simples
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 40px;
        border-radius: 16px;
        max-width: 500px;
        width: 100%;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      ">
        <div style="font-size: 4rem; margin-bottom: 20px;">✅</div>
        <h2 style="color: var(--primary-color); margin-bottom: 15px; font-size: 1.8rem;">Plano Selecionado</h2>
        <p style="color: var(--text-light); margin-bottom: 10px; font-size: 1.1rem;">
          <strong>${planName}</strong>
        </p>
        <p style="color: var(--primary-color); font-size: 2rem; font-weight: bold; margin-bottom: 20px;">
          R$ ${planPrice}
        </p>
        <p style="color: var(--text-light); margin-bottom: 30px; line-height: 1.6;">
          Você será redirecionado para a página de checkout em instantes...
        </p>
        <button id="closeModal" style="
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        ">Continuar</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar modal
    const closeBtn = modal.querySelector('#closeModal');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Auto-fechar após 5 segundos
    setTimeout(() => {
      if (document.body.contains(modal)) {
        modal.remove();
      }
    }, 5000);
  }
}

// ========================================
// COUNTDOWN TIMER (para deadline de desconto)
// ========================================
class CountdownTimer {
  constructor(targetDate, elementId) {
    this.targetDate = new Date(targetDate).getTime();
    this.element = document.getElementById(elementId);
    
    if (!this.element) return;
    
    this.init();
  }
  
  init() {
    this.update();
    this.interval = setInterval(() => this.update(), 1000);
  }
  
  update() {
    const now = new Date().getTime();
    const distance = this.targetDate - now;
    
    if (distance < 0) {
      clearInterval(this.interval);
      this.element.innerHTML = '<span style="color: #ff6b6b;">Prazo encerrado!</span>';
      return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    this.element.innerHTML = `
      <strong>${days}</strong>d 
      <strong>${hours}</strong>h 
      <strong>${minutes}</strong>m 
      <strong>${seconds}</strong>s
    `;
  }
}

// ========================================
// SMOOTH SCROLL TO PRICING
// ========================================
function scrollToPricing() {
  const pricingSection = document.querySelector('.pricing-section');
  if (!pricingSection) return;
  
  const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
  const targetPosition = pricingSection.offsetTop - navHeight - 20;
  
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
}

// ========================================
// HIGHLIGHT DISCOUNT BADGES
// ========================================
function animateDiscountBadges() {
  const badges = document.querySelectorAll('.discount-badge');
  
  badges.forEach((badge, index) => {
    setTimeout(() => {
      badge.style.animation = 'pulse 1s ease-in-out';
    }, index * 200);
  });
}

// Keyframes para pulso (adicionar via JS se necessário)
function addPulseAnimation() {
  if (document.getElementById('pulse-animation')) return;
  
  const style = document.createElement('style');
  style.id = 'pulse-animation';
  style.textContent = `
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `;
  document.head.appendChild(style);
}

// ========================================
// STICKY CTA BUTTON (mobile)
// ========================================
function initStickyCTA() {
  if (window.innerWidth > 768) return;
  
  const stickyBtn = document.createElement('div');
  stickyBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
    color: white;
    padding: 15px;
    border-radius: 12px;
    text-align: center;
    font-weight: 600;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 999;
    cursor: pointer;
    transition: transform 0.3s ease;
    opacity: 0;
    transform: translateY(100px);
  `;
  
  stickyBtn.innerHTML = '🎟️ Ver Planos de Inscrição';
  document.body.appendChild(stickyBtn);
  
  stickyBtn.addEventListener('click', scrollToPricing);
  
  // Mostrar quando rolar além do hero
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    const hero = document.querySelector('.page-hero');
    
    if (!hero) return;
    
    if (currentScroll > hero.offsetHeight && currentScroll > lastScroll) {
      stickyBtn.style.opacity = '1';
      stickyBtn.style.transform = 'translateY(0)';
    } else if (currentScroll < hero.offsetHeight) {
      stickyBtn.style.opacity = '0';
      stickyBtn.style.transform = 'translateY(100px)';
    }
    
    lastScroll = currentScroll;
  });
}

// ========================================
// CALCULATE TOTAL WITH DISCOUNT (para grupos)
// ========================================
function calculateGroupDiscount(numPeople, pricePerPerson) {
  let discount = 0;
  
  if (numPeople >= 20) {
    discount = 0.20; // 20%
  } else if (numPeople >= 10) {
    discount = 0.15; // 15%
  } else if (numPeople >= 5) {
    discount = 0.10; // 10%
  }
  
  const total = numPeople * pricePerPerson;
  const discountAmount = total * discount;
  const finalTotal = total - discountAmount;
  
  return {
    total,
    discount: discount * 100,
    discountAmount,
    finalTotal,
    pricePerPersonAfterDiscount: finalTotal / numPeople
  };
}

// Exemplo de uso:
// const result = calculateGroupDiscount(12, 950);
// console.log(`Total: R$ ${result.total}`);
// console.log(`Desconto: ${result.discount}% (R$ ${result.discountAmount})`);
// console.log(`Total Final: R$ ${result.finalTotal}`);

// ========================================
// FORM VALIDATION (se houver formulário)
// ========================================
function validateInscricaoForm(formData) {
  const errors = [];
  
  // CPF
  if (!formData.cpf || !isValidCPF(formData.cpf)) {
    errors.push('CPF inválido');
  }
  
  // Email
  if (!formData.email || !isValidEmail(formData.email)) {
    errors.push('E-mail inválido');
  }
  
  // Telefone
  if (!formData.telefone || formData.telefone.length < 10) {
    errors.push('Telefone inválido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function isValidCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ========================================
// LOCAL STORAGE - Salvar plano selecionado
// ========================================
function savePlanSelection(planData) {
  try {
    localStorage.setItem('selectedPlan', JSON.stringify(planData));
    console.log('Plano salvo:', planData);
  } catch (error) {
    console.error('Erro ao salvar plano:', error);
  }
}

function getPlanSelection() {
  try {
    const data = localStorage.getItem('selectedPlan');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Erro ao recuperar plano:', error);
    return null;
  }
}

// ========================================
// ANALYTICS TRACKING
// ========================================
function trackEvent(category, action, label, value) {
  // Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
  
  // Console log para debug
  console.log('Event tracked:', { category, action, label, value });
}

// Exemplos de tracking:
// trackEvent('Inscricao', 'Click', 'Plano Medico', 950);
// trackEvent('Inscricao', 'View', 'Pricing Page');

// ========================================
// RESPONSIVE ADJUSTMENTS
// ========================================
function handleResize() {
  const width = window.innerWidth;
  
  // Ajustar animações no mobile
  if (width <= 768) {
    document.querySelectorAll('.pricing-card').forEach(card => {
      card.style.animationDelay = '0s';
    });
  }
}

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Accordion
  const accordionContainer = document.querySelector('.accordion');
  if (accordionContainer) {
    new Accordion(accordionContainer);
    console.log('✅ Accordion inicializado');
  }
  
  // Inicializar Pricing Cards
  new PricingCards();
  console.log('✅ Pricing cards inicializados');
  
  // Adicionar animação de pulso
  addPulseAnimation();
  
  // Animar badges de desconto após 500ms
  setTimeout(animateDiscountBadges, 500);
  
  // Inicializar sticky CTA no mobile
  initStickyCTA();
  
  // Countdown timer (exemplo: até 31 de janeiro de 2025)
  // const countdownElement = document.getElementById('countdown');
  // if (countdownElement) {
  //   new CountdownTimer('2025-01-31 23:59:59', 'countdown');
  // }
  
  // Handle resize
  window.addEventListener('resize', handleResize);
  handleResize();
  
  // Track page view
  trackEvent('Inscricao', 'View', 'Pricing Page');
  
  console.log('✅ Página de inscrição carregada completamente');
});

// ========================================
// UTILITY: Format currency
// ========================================
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// ========================================
// UTILITY: Format CPF
// ========================================
function formatCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// ========================================
// EXPORT FUNCTIONS (se necessário)
// ========================================
window.InscricaoUtils = {
  calculateGroupDiscount,
  validateInscricaoForm,
  formatCurrency,
  formatCPF,
  isValidCPF,
  isValidEmail,
  savePlanSelection,
  getPlanSelection
};