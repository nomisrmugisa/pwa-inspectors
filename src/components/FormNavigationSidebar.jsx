import React, { useState, useEffect, useRef } from 'react';
import { isSectionHeaderName, normalizeSectionHeaderName, calculateProgress, getProgressCounts } from '../utils/formUtils';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import './FormNavigationSidebar.css';

const FormNavigationSidebar = ({
    sections,
    formData,
    activeSectionId,
    onSectionClick,
    onSubsectionClick,
    inspectionInfoConfirmed
}) => {
    const [expandedSections, setExpandedSections] = useState({});
    const hasMounted = useRef(false);
    // Auto-expand the active section whenever it changes, except on initial mount
    useEffect(() => {
        if (activeSectionId && hasMounted.current) {
            setExpandedSections(prev => ({
                ...prev,
                [activeSectionId]: true
            }));
        }
        hasMounted.current = true;
    }, [activeSectionId]);

    const toggleSection = (sectionId, e) => {
        e.stopPropagation(); // Prevent triggering onSectionClick if clicked on chevron
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const getSubsections = (section) => {
        const subs = [];
        let currentSub = null;

        section.dataElements?.forEach(psde => {
            const name = psde?.dataElement?.displayName;
            if (!name) return;
            if (isSectionHeaderName(name)) {
                if (currentSub) subs.push(currentSub);
                currentSub = {
                    id: psde.dataElement.id,
                    name: normalizeSectionHeaderName(name),
                    elements: []
                };
            } else if (currentSub) {
                currentSub.elements.push(psde);
            }
        });
        if (currentSub) subs.push(currentSub);
        return subs;
    };

    const isLocked = (sectionName) => {
        const lowerName = sectionName.toLowerCase();
        const isSpecial = lowerName.includes('inspection information') || lowerName.includes('inspection type');
        return !isSpecial && !inspectionInfoConfirmed;
    };

    return (
        <div className="form-navigation-sidebar">
            <div className="sidebar-header">
                <h3>Inspection Progress</h3>
                <div className="overall-progress">
                    {/* Overall progress could go here if needed */}
                </div>
            </div>
            <div className="sidebar-content">
                {sections.map((section) => {
                    const sectionProgress = calculateProgress(section.dataElements, formData);
                    const subsections = getSubsections(section);
                    const locked = isLocked(section.displayName);
                    const isActive = activeSectionId === section.id;

                    return (
                        <div
                            key={section.id}
                            className={`nav-section-item ${isActive ? 'active' : ''} ${locked ? 'locked' : ''}`}
                        >
                            <div
                                className="section-main-info"
                                onClick={() => {
                                    if (!locked) {
                                        onSectionClick(section.id);
                                        setExpandedSections(prev => ({
                                            ...prev,
                                            [section.id]: true
                                        }));
                                    }
                                }}
                            >
                                <div className="section-header-row">
                                    <div className="section-name">
                                        {locked && <span className="lock-icon">🔒</span>}
                                        {section.displayName}
                                    </div>
                                    {subsections.length > 0 && (
                                        <div
                                            className="expand-icon"
                                            onClick={(e) => !locked && toggleSection(section.id, e)}
                                        >
                                            {expandedSections[section.id] ? <FaChevronDown /> : <FaChevronRight />}
                                        </div>
                                    )}
                                </div>
                                <div className="progress-container">
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${sectionProgress}%` }}
                                    ></div>
                                    <span className="progress-text">{sectionProgress}%</span>
                                </div>
                            </div>

                            {expandedSections[section.id] && subsections.length > 0 && (
                                <div className="subsections-list">
                                    {subsections.map(sub => {

                                        const { answered, total } = getProgressCounts(sub.elements, formData);
                                        const subProgress = total === 0 ? 0 : Math.round((answered / total) * 100);
                                        return (
                                            <div
                                                key={sub.id}
                                                className="nav-subsection-item"
                                                onClick={() => onSubsectionClick(section.id, sub.id)}
                                            >
                                                <div className="sub-header-row">
                                                    <span className="sub-name">{sub.name}</span>
                                                    <span className="sub-count">{answered}/{total}</span>
                                                </div>
                                                <div className="sub-progress-mini">
                                                    <div
                                                        className="sub-progress-bar"
                                                        style={{ width: `${subProgress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FormNavigationSidebar;
