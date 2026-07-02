pipeline {
  agent any

  environment {
    NODE_ENV = 'test'
    SONAR_HOST_URL = 'https://sonarqube.cicd.kits.ext.educentre.fr'
    SONAR_PROJECT_KEY = 'Examen-tasklist-backend'
    SONAR_PROJECT_NAME = 'Examen-tasklist-backend'
    DOCKERHUB_CREDENTIALS_ID = 'id-dockerhub'
    SONAR_TOKEN_CREDENTIAL_ID = 'id-sonar'
    DOCKERHUB_REPOSITORY = 'kiss04/tasklist-backend'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Generate Prisma client') {
      steps {
        sh 'npm run prisma:generate'
      }
    }

    stage('Run unit tests') {
      steps {
        sh 'npm run test:coverage'
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'reports/junit.xml'
          archiveArtifacts allowEmptyArchive: true, artifacts: 'reports/junit.xml', fingerprint: true
        }
      }
    }

    stage('Run e2e tests') {
      steps {
        sh 'npm run test:e2e:coverage'
      }
    }

    stage('Build TypeScript') {
      steps {
        sh 'npm run build'
      }
    }

    stage('SonarQube analysis') {
      steps {
        withSonarQubeEnv('SonarQube') {
          withCredentials([string(credentialsId: 'id-sonar', variable: 'SONAR_TOKEN')]) {
            sh 'npx sonar-scanner'
          }
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 10, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Build Docker image') {
      steps {
        sh "docker build -t ${DOCKERHUB_REPOSITORY}:${IMAGE_TAG} ."
      }
    }

    stage('Trivy image scan') {
      steps {
        sh "trivy image --cache-dir /tmp/trivy-cache-${BUILD_NUMBER} --exit-code 0 --ignore-unfixed --severity HIGH,CRITICAL --format table --output trivy-report.txt ${DOCKERHUB_REPOSITORY}:${IMAGE_TAG}"
      }
      post {
        always {
          archiveArtifacts allowEmptyArchive: true, artifacts: 'trivy-report.txt', fingerprint: true
        }
      }
    }

    stage('Generate SBOM') {
        steps {
            sh "trivy image --cache-dir /tmp/trivy-cache-${BUILD_NUMBER} --format cyclonedx --output sbom.json ${DOCKERHUB_REPOSITORY}:${IMAGE_TAG}"
        }
        post {
            always {
            archiveArtifacts allowEmptyArchive: true, artifacts: 'sbom.json', fingerprint: true
            }
        }
    }

    stage('Publish Docker image') {
      when {
        branch 'main'
      }
      steps {
        withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker tag ${DOCKERHUB_REPOSITORY}:${IMAGE_TAG} ${DOCKERHUB_REPOSITORY}:latest
            docker push ${DOCKERHUB_REPOSITORY}:${IMAGE_TAG}
            docker push ${DOCKERHUB_REPOSITORY}:latest
          '''
        }
      }
    }
  }

  post {
    always {
      echo 'Nettoyage du workspace Jenkins.'
      deleteDir()
    }
    success {
      echo 'Pipeline CI/CD terminée avec succès.'
    }
    failure {
      echo 'La pipeline CI/CD a échoué.'
    }
  }
}