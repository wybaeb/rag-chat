import { marked } from 'marked';

export function createElement(tag, styles = {}, attributes = {}) {
    const element = document.createElement(tag);
    Object.assign(element.style, styles);
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
