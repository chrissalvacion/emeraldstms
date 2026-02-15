import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import rates from '@/routes/rates';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Rates() {
	const { props } = usePage();
	const defaultGradeSchool = String((props as any).default_rate_grade_school ?? '');
	const defaultSecondary = String((props as any).default_rate_secondary ?? '');
	const tutorFeeElementary = String((props as any).tutor_fee_elementary ?? '');
	const tutorFeeJhs = String((props as any).tutor_fee_jhs ?? '');
	const tutorFeeShs = String((props as any).tutor_fee_shs ?? '');

	const breadcrumbs: BreadcrumbItem[] = [
		{ title: 'Rates', href: '/rates' },
	];

	const { data, setData, put, processing, errors } = useForm({
		default_rate_grade_school: defaultGradeSchool,
		default_rate_secondary: defaultSecondary,
		tutor_fee_elementary: tutorFeeElementary,
		tutor_fee_jhs: tutorFeeJhs,
		tutor_fee_shs: tutorFeeShs,
	});

	const [activeSection, setActiveSection] = useState<'tutorial' | 'tutor'>('tutorial');

	useEffect(() => {
		setData('default_rate_grade_school', defaultGradeSchool);
		setData('default_rate_secondary', defaultSecondary);
		setData('tutor_fee_elementary', tutorFeeElementary);
		setData('tutor_fee_jhs', tutorFeeJhs);
		setData('tutor_fee_shs', tutorFeeShs);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultGradeSchool, defaultSecondary, tutorFeeElementary, tutorFeeJhs, tutorFeeShs]);

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Rates" />

			<div className="px-4 py-6">
				<Heading title="Pricing and Rates" description="Manage default tutorial session pricing" />

				<div className="flex flex-col lg:flex-row lg:space-x-12">
					<aside className="w-full max-w-xl lg:w-48">
						<nav className="flex flex-col space-y-1 space-x-0">
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setActiveSection('tutorial')}
								className={cn('w-full justify-start', {
									'bg-muted': activeSection === 'tutorial',
								})}
							>
								Tutorial Rates
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setActiveSection('tutor')}
								className={cn('w-full justify-start', {
									'bg-muted': activeSection === 'tutor',
								})}
							>
								Tutor Fees
							</Button>
						</nav>
					</aside>

					<Separator className="my-6 lg:hidden" />

					<div className="flex-1 md:max-w-2xl">
						<section className="max-w-xl space-y-12">
							<div className="space-y-6">
								{activeSection === 'tutorial' && (
									<>
										<HeadingSmall
											title="Tutorial Rates"
											description="Set default hourly rates by year level"
										/>

										<form
											className="space-y-6"
											onSubmit={(e) => {
												e.preventDefault();
												put(rates.update().url, { preserveScroll: true });
											}}
										>
											<div className="grid gap-6">
												<div className="grid gap-2">
													<Label htmlFor="default_rate_grade_school">Grade School hourly rate (₱)</Label>
													<Input
														id="default_rate_grade_school"
														type="number"
														step="0.01"
														min={0}
														value={String(data.default_rate_grade_school ?? '')}
														onChange={(e) => setData('default_rate_grade_school', e.target.value)}
														required
													/>
													<InputError message={(errors as any).default_rate_grade_school} />
												</div>

												<div className="grid gap-2">
													<Label htmlFor="default_rate_secondary">Secondary hourly rate (₱)</Label>
													<Input
														id="default_rate_secondary"
														type="number"
														step="0.01"
														min={0}
														value={String(data.default_rate_secondary ?? '')}
														onChange={(e) => setData('default_rate_secondary', e.target.value)}
														required
													/>
													<InputError message={(errors as any).default_rate_secondary} />
												</div>
											</div>

											<div className="flex items-center gap-4">
												<Button type="submit" disabled={processing}>
													{processing ? 'Saving...' : 'Save'}
												</Button>
											</div>
										</form>
									</>
								)}

								{activeSection === 'tutor' && (
									<>
										<HeadingSmall
											title="Tutor Fees"
											description="Set tutor fees by education level"
										/>

										<form
											className="space-y-6"
											onSubmit={(e) => {
												e.preventDefault();
												put(rates.update().url, { preserveScroll: true });
											}}
										>
											<div className="grid gap-6">
												<div className="grid gap-2">
													<Label htmlFor="tutor_fee_elementary">Elementary (₱)</Label>
													<Input
														id="tutor_fee_elementary"
														type="number"
														step="0.01"
														min={0}
														value={String(data.tutor_fee_elementary ?? '')}
														onChange={(e) => setData('tutor_fee_elementary', e.target.value)}
													/>
													<InputError message={(errors as any).tutor_fee_elementary} />
												</div>

												<div className="grid gap-2">
													<Label htmlFor="tutor_fee_jhs">Junior High School (₱)</Label>
													<Input
														id="tutor_fee_jhs"
														type="number"
														step="0.01"
														min={0}
														value={String(data.tutor_fee_jhs ?? '')}
														onChange={(e) => setData('tutor_fee_jhs', e.target.value)}
													/>
													<InputError message={(errors as any).tutor_fee_jhs} />
												</div>

												<div className="grid gap-2">
													<Label htmlFor="tutor_fee_shs">Senior High School (₱)</Label>
													<Input
														id="tutor_fee_shs"
														type="number"
														step="0.01"
														min={0}
														value={String(data.tutor_fee_shs ?? '')}
														onChange={(e) => setData('tutor_fee_shs', e.target.value)}
													/>
													<InputError message={(errors as any).tutor_fee_shs} />
												</div>
											</div>

											<div className="flex items-center gap-4">
												<Button type="submit" disabled={processing}>
													{processing ? 'Saving...' : 'Save'}
												</Button>
											</div>
										</form>
									</>
								)}
							</div>
						</section>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}

