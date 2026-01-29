import React from 'react';
import { FindIcon } from './Icons';
import './EmptyState.css';

const EmptyState = ({ 
    icon = <FindIcon />, 
    title = "No se encontraron resultados", 
    message = "Intentá ajustar tus filtros o agregar un nuevo registro." 
}) => {
    return (
        <div className="empty-state-container">
            <div className="empty-state-glass">
                <div className="empty-state-icon">
                    {icon}
                </div>
                <h3 className="empty-state-title">{title}</h3>
                <p className="empty-state-message">{message}</p>
            </div>
        </div>
    );
};

export default EmptyState;
