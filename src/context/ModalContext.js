import React, { createContext, useContext, useState, useCallback } from "react";
import CustomModal from "../components/UI/CustomModal";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState(null);

    const showModal = useCallback(({ type, title, message, placeholder, defaultValue, confirmText, cancelText }) => {
        return new Promise((resolve) => {
            setModalConfig({
                type,
                title,
                message,
                placeholder,
                defaultValue,
                confirmText,
                cancelText,
                onConfirm: (val) => {
                    setModalConfig(null);
                    resolve(val);
                },
                onClose: () => {
                    setModalConfig(null);
                    resolve(null);
                }
            });
        });
    }, []);

    const showAlert = (title, message) => showModal({ type: "alert", title, message });
    const showConfirm = (title, message) => showModal({ type: "confirm", title, message });
    const showPrompt = (title, message, defaultValue = "") => showModal({ type: "prompt", title, message, defaultValue });

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
            {children}
            {modalConfig && (
                <CustomModal
                    isOpen={!!modalConfig}
                    {...modalConfig}
                />
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => useContext(ModalContext);
