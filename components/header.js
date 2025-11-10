class CustomHeader extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                header {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                
                .header-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1.5rem 2rem;
                }
                
                .logo {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 700;
                    font-size: 1.5rem;
                }
                
                .logo-icon {
                    width: 2rem;
                    height: 2rem;
                }
                
                @media (max-width: 768px) {
                    .header-content {
                        padding: 1rem;
                    }
                    
                    .logo {
                        font-size: 1.25rem;
                    }
                }
            </style>
            <header>
                <div class="header-content">
                    <div class="logo">
                        <svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 3v18h18"></path>
                            <rect x="12" y="7" width="3" height="9"></rect>
                            <rect x="7" y="7" width="3" height="5"></rect>
                            <rect x="17" y="7" width="3" height="12"></rect>
                        </svg>
                        DataViz Dashboard
                    </div>
                </div>
            </header>
        `;
    }
}

customElements.define('custom-header', CustomHeader);