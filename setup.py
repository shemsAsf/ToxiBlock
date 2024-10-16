from setuptools import setup, find_packages

setup(
    name='ToxiBlock',
    version='1.0.0',
    description='Un modèle pour la classification des commentaires toxiques.',
    author='Ton Nom',
    author_email='ton.email@example.com',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'tensorflow==2.16.2',
        'keras-tuner==1.3.5',
        'pandas==1.5.3',
        'numpy==1.24.3',
        'matplotlib==3.7.1',
        'seaborn==0.12.2',
        'pickle5==0.0.11',
    ],
)

