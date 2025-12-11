import { marked } from 'marked';

export function createElement(tag, styles = {}, attributes = {}) {
    const element = document.createElement(tag);
    
    // Add protective data attribute to all widget elements
    element.setAttribute('data-rag-chat-widget', '');
    
    // Apply styles with defensive approach
    Object.keys(styles).forEach(key => {
        // Convert camelCase to kebab-case for CSS properties
        const cssKey = key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
        
        // Critical layout properties that must override external styles
        const criticalProps = [
            'box-sizing', '-webkit-box-sizing', '-moz-box-sizing',
            'position', 'display', 'flex-direction', 'align-items', 'justify-content',
            'width', 'height', 'padding', 'margin', 'border', 'border-radius',
            'background', 'background-color', 'color', 'font-size', 'font-family',
            'cursor', 'z-index', 'overflow', 'flex', 'gap'
        ];
        
        // Use setProperty with 'important' for critical properties
        if (criticalProps.includes(cssKey)) {
            element.style.setProperty(cssKey, styles[key], 'important');
        } else {
            element.style[key] = styles[key];
        }
    });
    
    Object.assign(element, attributes);
    return element;
}

export function appendChildren(parent, children) {
    children.forEach(child => parent.appendChild(child));
}

export function formatText(text) {
    try {
        return marked(text);
    } catch (error) {
        console.warn('Markdown formatting failed, returning plain text:', error);
        return text;
    }
}
