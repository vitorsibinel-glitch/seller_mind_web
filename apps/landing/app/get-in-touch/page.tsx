"use client";

import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

export default function GetInTouchPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    isSellermindUser: "",
    email: "",
    cellphone: "",
    billing: "",
    platform: "",
  });

  const steps = [
    {
      id: "name",
      question: "Nome",
      subtitle: "Nome completo",
      type: "text",
      field: "name",
    },
    {
      id: "sellermind",
      question: "É usuário Sellermind?",
      type: "radio",
      field: "isSellermindUser",
      options: [
        { value: "yes", label: "Sim" },
        { value: "no", label: "Não" },
      ],
    },
    {
      id: "email",
      question: "E-mail",
      type: "email",
      field: "email",
    },
    {
      id: "cellphone",
      question: "Celular",
      type: "text",
      field: "cellphone",
    },
    {
      id: "billing",
      question: "Faturamento do seu negócio digital",
      type: "radio",
      field: "billing",
      options: [
        { value: "100k-500k", label: "Entre 100k e 500k" },
        { value: "500k-1M", label: "Entre 500k e 1M" },
        { value: "above-1M", label: "Acima de 1M" },
      ],
    },
    {
      id: "platform",
      question: "Qual plataforma utiliza atualmente?",
      type: "text",
      field: "platform",
    },
  ];

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log("Form submitted:", formData);
      setIsComplete(true);
    }
  };

  const canContinue = () => {
    const currentField = steps[currentStep]?.field;
    if (!currentField) return false;
    return formData[currentField as keyof typeof formData]?.trim() !== "";
  };

  const currentStepData = steps[currentStep];

  // Tela final de obrigado
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Obrigado!
            </h1>
            <p className="text-xl text-foreground mb-2">
              Em breve entraremos em contato
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Voltar para início
          </button>
        </div>
      </div>
    );
  }

  if (!currentStepData) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header com indicador de campos obrigatórios */}
        <div className="mb-8">
          <p className="text-sm text-foreground">
            <span className="text-danger">*</span> indica campos obrigatórios
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mb-12">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index <= currentStep ? "bg-primary" : "bg-foreground/10"
              }`}
            />
          ))}
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            {currentStepData.question}
            <span className="text-danger ml-1">*</span>
          </h1>
          {currentStepData.subtitle && (
            <p className="text-foreground">{currentStepData.subtitle}</p>
          )}
        </div>

        <div className="mb-8">
          {(currentStepData.type === "text" ||
            currentStepData.type === "email") && (
            <input
              type={currentStepData.type}
              value={
                formData[currentStepData.field as keyof typeof formData] || ""
              }
              onChange={(e) =>
                handleInputChange(currentStepData.field, e.target.value)
              }
              placeholder={
                currentStepData.type === "email" ? "seu@email.com" : ""
              }
              className="w-full px-4 py-3 border-2 border-foreground/10 rounded-lg focus:border-primary focus:outline-none text-foreground text-lg transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && canContinue()) {
                  handleContinue();
                }
              }}
            />
          )}

          {currentStepData.type === "radio" && (
            <div className="space-y-3">
              {currentStepData.options?.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="relative">
                    <input
                      type="radio"
                      name={currentStepData.field}
                      value={option.value}
                      checked={
                        formData[
                          currentStepData.field as keyof typeof formData
                        ] === option.value
                      }
                      onChange={(e) =>
                        handleInputChange(currentStepData.field, e.target.value)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        formData[
                          currentStepData.field as keyof typeof formData
                        ] === option.value
                          ? "border-primary bg-primary"
                          : "border-foreground/20 group-hover:border-primary"
                      }`}
                    >
                      {formData[
                        currentStepData.field as keyof typeof formData
                      ] === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                  <span className="text-lg text-foreground">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Voltar
          </Button>

          <div className="flex items-center gap-4">
            <Button onClick={handleContinue} disabled={!canContinue()}>
              Continuar
            </Button>
            <span className="text-sm text-muted-foreground">
              Pressione ENTER <span className="text-lg">↵</span>
            </span>
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={!canContinue() || currentStep === steps.length - 1}
            className="flex items-center gap-2 px-4 py-2"
          >
            Avançar
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
