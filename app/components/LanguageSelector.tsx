"use client";

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const uiLanguages = [
	{ code: 'en', name: 'English', flag: '🇺🇸' },
	{ code: 'es', name: 'Español', flag: '🇪🇸' },
	{ code: 'fr', name: 'Français', flag: '🇫🇷' },
	{ code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export function LanguageSelector() {
	const { language, setLanguage } = useI18n();

	const currentLanguage = uiLanguages.find((lang) => lang.code === language);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="flex items-center space-x-2">
					<Globe className="w-4 h-4" />
					<span className="text-lg">{currentLanguage?.flag}</span>
					<span className="hidden sm:inline">{currentLanguage?.name}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{uiLanguages.map((lang) => (
					<DropdownMenuItem
						key={lang.code}
						onClick={() => setLanguage(lang.code)}
						className="flex items-center space-x-2 cursor-pointer"
					>
						<span className="text-lg">{lang.flag}</span>
						<span>{lang.name}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}