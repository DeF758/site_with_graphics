class CustomFooter extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                footer {
                    background-color: #1f2937;
                    color: #f3f4f6;
                    padding: 2rem 0;
                }
                
                .footer-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                
                .footer-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                }
                
                .footer-column {
                    flex: 1;
                    min-width: 150px;
                }
                
                .footer-column h3 {
                    font-weight: 600;
                    margin-bottom: 0.75rem;
                    font-size: 1.125rem;
                }
                
                .footer-column ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .footer-column li {
                    margin-bottom: 0.5rem;
                }
                
                .footer-column a {
                    color: #d1d5db;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                
                .footer-column a:hover {
                    color: white;
                }
                
                .footer-bottom {
                    border-top: 1px solid #374151;
                    padding-top: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    text-align: center;
                }
                
                .social-links {
                    display: flex;
                    gap: 1rem;
                }
                
                .social-links a {
                    color: #9ca3af;
                    transition: color 0.2s;
                }
                
                .social-links a:hover {
                    color: white;
                }
                
                @media (max-width: 768px) {
                    .footer-content {
                        padding: 0 1rem;
                    }
                    
                    .footer-column {
                        min-width: 120px;
                    }
                }
            </style>
            <footer>
                <div class="footer-content">
                    <div class="footer-links">
                        <div class="footer-column">
                            <h3>Product</h3>
                            <ul>
                                <li><a href="#">Features</a></li>
                                <li><a href="#">Pricing</a></li>
                                <li><a href="#">Documentation</a></li>
                            </ul>
                        </div>
                        <div class="footer-column">
                            <h3>Company</h3>
                            <ul>
                                <li><a href="#">About</a></li>
                                <li><a href="#">Careers</a></li>
                                <li><a href="#">Contact</a></li>
                            </ul>
                        </div>
                        <div class="footer-column">
                            <h3>Resources</h3>
                            <ul>
                                <li><a href="#">Blog</a></li>
                                <li><a href="#">Tutorials</a></li>
                                <li><a href="#">Support</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p>&copy; 2024 DataViz Dashboard. All rights reserved.</p>
                        <div class="social-links">
                            <a href="#" aria-label="Twitter">
                                <i data-feather="twitter"></i>
                            </a>
                            <a href="#" aria-label="GitHub">
                                <i data-feather="github"></i>
                            </a>
                            <a href="#" aria-label="LinkedIn">
                                <i data-feather="linkedin"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        `;
        
        // Replace feather icons after rendering
        setTimeout(() => {
            feather.replace(this.shadowRoot);
        }, 100);
    }
}

customElements.define('custom-footer', CustomFooter);